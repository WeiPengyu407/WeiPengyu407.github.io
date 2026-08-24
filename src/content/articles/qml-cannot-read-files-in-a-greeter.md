---
title: Qt 6 禁了 QML 读本地文件，而锁屏进程的环境变量你控制不了
saves: QML 里用 XMLHttpRequest 读 file:// 会拿到空结果。Qt 6 默认禁了它，开关是环境变量 QML_XHR_ALLOW_FILE_READ=1——但如果你的 QML 跑在别人拉起的进程里，你根本没机会设这个变量。真正的解法是不在运行时读文件。
date: 2026-08-24
tags: ["Qt", "QML", "KDE Plasma", "静默失败"]
---

我给 KDE Plasma 做了个图片密码锁屏：在图片的约定位置连点三下就解锁，替掉输密码。它是一套 QML，跑在 `kscreenlocker` 的 greeter 进程里。

这套 QML 要读两样东西：

- `config.json`——点位坐标、需要点几下、判定半径
- `~/.config/picture-lock.secret`——预存的密码，点对了之后交给 PAM

QML 里读文件，第一反应就是 `XMLHttpRequest` 配 `file://` 的 URL。写完，装上，锁屏。

## 症状

图片正常显示，点击的反馈圆点正常闪，点对三下之后，屏幕下方冒出一行字：

```
没有找到预存密码，请用密码解锁
```

这行是我自己写的兜底：读不到密码就退回普通密码框，别把人锁在外面。所以逻辑是对的，问题在读不到。

而「读不到」这件事，`XMLHttpRequest` 没有报错。它走完了整个请求流程，回调正常触发，`responseText` 是空字符串。

## 定位

我一开始怀疑路径。`file://` 后面几个斜杠、要不要展开 `~`、greeter 进程的工作目录在哪、有没有权限——全都查了，全都不是。文件确实存在，权限确实可读，同一条路径我在别的地方读得到。

转折点是去翻 Qt 自己的字符串：

```bash
strings /usr/lib64/libQt6Qml.so.6 | grep -i XHR
```

```
QML_XHR_ALLOW_FILE_READ
QML_XHR_ALLOW_FILE_WRITE
QML_XHR_DUMP
Set QML_XHR_ALLOW_FILE_READ to 1 to enable this feature.
```

结案。Qt 6 默认关掉了 QML 通过 `XMLHttpRequest` 访问本地文件，要用得显式开。这是个合理的默认值——QML 场景里经常有远程加载的代码，让它随便读本地磁盘不是好主意。

## 但那个开关我用不了

看到环境变量的第一反应是：那就设上。

设不了。这套 QML 不是我启动的，是锁屏的 greeter 加载的，而 greeter 是合成器在锁屏的那一刻自己拉起来的。这条链路上没有任何一处是我的 shell，我也不该去改系统的 service 文件来给一个锁屏主题传环境变量。

这里有个更一般的教训：**在别人的进程里跑的代码，不要把环境变量当成可配置项**。你能改的是你自己启动的东西。插件、主题、扩展这类「被宿主加载」的代码，宿主的环境是给定条件，不是参数。

## 解法：把运行时读文件这一步整个删掉

绕开的办法不是找另一种读文件的 API，是承认这个进程里读不了文件，把读取挪到安装的时候。

安装脚本把配置和密码烘成一个 JS 文件：

```bash
print(".pragma library")
print("var point = %s;" % json.dumps(cfg.get("point", [0.589, 0.730])))
print("var taps = %s;" % json.dumps(cfg.get("taps", 3)))
print("var tolerance = %s;" % json.dumps(cfg.get("tolerance", 0.05)))
print("var secret = %s;" % json.dumps(secret))
```

QML 那边改成一行 import：

```qml
import "settings.js" as Settings
```

然后直接读 `Settings.point`、`Settings.secret`。

能行的原因是 `import` 和 `XMLHttpRequest` 走的是两套完全不同的机制：`import` 是 QML 引擎加载模块，settings.js 在引擎眼里就是这个组件的一部分源码，跟 `LockScreen.qml` 同等地位；而 XHR 是运行时的网络请求 API，本地文件访问才是它被限制的那一项。前者不受后者的开关影响。

`.pragma library` 是告诉引擎这个 JS 无状态、可以跨组件共享一份实例，不用每次加载都重新求值。

写文件的时候有个顺序细节值得留意：

```bash
touch "$SETTINGS_JS"
chmod 600 "$SETTINGS_JS"
python3 > "$SETTINGS_JS" <<'PY'
```

先建文件、先改权限，再往里写内容。反过来的话，密码会有一小段时间躺在一个所有人可读的文件里。重定向只会截断文件、不会重置权限，所以这个顺序是安全的。

## 代价

配置从「运行时读」变成「安装时烘进去」，意味着改完 `config.json` 必须重跑安装脚本才生效。

这个代价是实打实的，而且它是一类新的静默失败：你改了配置文件，锁屏行为没变，而没有任何东西告诉你为什么。所以脚本最后加了一句检查——读不到密码就直接把话说出来：

```bash
if grep -q 'var secret = ""' "$SETTINGS_JS"; then
    echo "警告：没读到 $HOME/.config/picture-lock.secret，图片点对了也只会退回密码框"
fi
```

顺便说清楚：密码是明文存在这个文件里的，600 权限，仅此而已。我这台机器上没有值得保护的东西，这个取舍我接受。如果你的不是，别照抄这一段——图片密码本身也不是安全机制，它是个手感。
