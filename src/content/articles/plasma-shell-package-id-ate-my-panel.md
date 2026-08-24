---
title: 我给 KDE 换了个自定义 shell 包，然后桌面面板消失了
saves: plasmashell 的部件配置文件名是按 shell 包 ID 拼的。换个自定义 ID，桌面会拿到一套空白布局——现象和你改的东西看着毫无关系。
date: 2026-08-24
tags: ["KDE Plasma", "plasmashell", "静默失败"]
featured: false
---

要改 Plasma 的锁屏界面，正规做法是提供一个自己的 shell 包，因为 `kscreenlocker` 从 shell 包的 `contents/lockscreen/` 加载 QML。

我按教科书做法办：新建包，`metadata.json` 里给它一个干净的自己的 ID，`org.pengyu.picturelock`，装到 `~/.local/share/plasma/shells/` 下面。

重启会话。锁屏是我的了。**桌面面板没了。**

不是变形、不是错位，是彻底不存在。桌面壁纸在，图标在，底部那条面板凭空消失，右键也召不回来。

## 为什么这两件事会有关系

它们看起来毫无关系，这正是这个坑难受的地方。我改的是锁屏，坏的是面板。

原因在于 plasmashell 的部件配置文件名不是固定的，是**按当前 shell 包的 ID 拼出来的**：

```
plasma-org.kde.plasma.desktop-appletsrc
       └────────────────────┘
        shell 包 ID
```

我的面板布局、部件位置、每个部件的设置，全在这个文件里。当我把 shell 包 ID 换成 `org.pengyu.picturelock`，plasmashell 就去找：

```
plasma-org.pengyu.picturelock-appletsrc
```

这个文件不存在。plasmashell 的反应不是报错，而是非常合理地认为：这是一套全新的 shell，用户还没配置过，那就给一套默认布局。而这个自定义包里没写任何默认布局——我只放了锁屏——所以「默认」就是空的。

**它干得完全正确。是我给它的前提错了。**

## 怎么定位到的

我一开始完全在错误的方向上，翻的是面板相关的配置和 plasmashell 的日志。日志里没有任何异常。

转折点是一个笨办法：**把改动一件件退回去，看是哪一件让面板回来的。** 退到把 `metadata.json` 里的 ID 改回 `org.kde.plasma.desktop`，面板立刻回来了。

确认之后再去看配置目录，一切就都说得通了：

```bash
ls ~/.config/plasma-*-appletsrc
```

```
/home/pengyu/.config/plasma-org.kde.plasma.desktop-appletsrc
```

只有一个，名字里嵌着包 ID。到这里因果链就闭合了。

值得说的是，这一步靠的是**二分排除**，不是靠读代码或者读文档。文档没有在任何地方警告我换 ID 会丢面板配置。当现象和改动之间的关系完全说不通时，退回去一件件试往往是最快的路，比继续盯着现象猜要快得多。

## 正确做法：影子掉系统包，别另起一个

答案是**沿用原来的包 ID**，用 `~/.local/share` 的查找优先级去覆盖系统包。用户目录先被搜到，所以你的版本生效；ID 没变，所以配置文件名不变，面板照旧。

```bash
PKG_ID=org.kde.plasma.desktop
SYS=/usr/share/plasma/shells/$PKG_ID
DEST=$HOME/.local/share/plasma/shells/$PKG_ID

mkdir -p "$DEST/contents"
cp "$SYS/metadata.json" "$DEST/metadata.json"

# 只有锁屏是自己的
cp -r ./my-lockscreen "$DEST/contents/lockscreen"

# 其余全部软链回系统包，plasma-workspace 更新能自动流过来
for entry in "$SYS/contents/"*; do
    name=$(basename "$entry")
    [ "$name" = lockscreen ] && continue
    ln -sfn "$entry" "$DEST/contents/$name"
done
```

这样还有个附带好处：除锁屏之外的东西都是软链，系统包升级了你自动跟上，不用维护一份分叉。

代价是如果哪次升级在 `contents/` 下**新增**了顶层条目，你的影子包不会自动有，得重跑一遍这个脚本补上。这个代价我认，比维护整包拷贝划算。

## 还有一个更阴的

`contents/lockscreen` 那一项**必须是真实目录，不能是软链**。

我一开始很自然地把它软链到我的源码目录，好处是改 QML 立刻生效不用重装。结果：greeter 判定这个包无效，**静默回退到默认锁屏**。日志里一个字都没有，锁屏就是原来那个，好像我什么都没做。

所以上面脚本里那行是 `cp -r` 而不是 `ln -s`。代价是每次改完 QML 都得重跑安装脚本。

## 一天里两个静默失败

这两个坑有同一个形状：**系统认为自己处理得很合理，所以什么都不报，只是行为不是你要的。**

一个是配置文件找不到就给默认值。一个是包结构不合预期就回退默认实现。单独看，两个决策都是好设计——不崩、有兜底。合起来看，它们让整个调试过程变成猜谜，因为**兜底成功和真的成功，从外面看长得一模一样。**

我从这两件事里带走的规则是：**改完必须验证「我的东西生效了」，而不是只验证「没报错」**。这两件事完全不是一回事。锁屏那次我要是第一时间去确认加载的是不是我的 QML（比如先塞一个明显的红色方块进去），后面那一大段排查根本不用发生。
