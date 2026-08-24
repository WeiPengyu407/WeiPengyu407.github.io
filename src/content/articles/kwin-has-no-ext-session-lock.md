---
title: 别在 KDE Plasma 上试 swaylock 了，KWin 没实现 ext-session-lock-v1
saves: swaylock、hyprlock、waylock 这一整类锁屏在 Plasma Wayland 上不是配置问题，是协议根本没实现。省你一天的排查。
date: 2026-08-24
tags: ["KDE Plasma", "Wayland", "KWin"]
featured: true
---

我想给自己的机器换一个图片密码锁屏。思路很自然：Wayland 上有个标准协议 `ext-session-lock-v1`，专门用来让第三方程序接管锁屏；swaylock 之类的实现一堆，挑一个改改就行。

于是我装了 swaylock，运行，屏幕闪一下，进程退出。

## 症状

不管换哪个实现，结果一样：起不来，或者起来了但压不住桌面。查配置、查权限、查 PAM，全都正常。搜到的答案清一色是「检查你的 compositor 支持」——听着像句废话，但它恰好就是答案。

## 怎么定位到的

关键在于别再猜，直接去问 compositor 它到底提供了什么。Wayland 的设计里，compositor 会广播一份「全局接口」清单，客户端能拿到的能力全在里面。这份清单是可以直接列出来看的：

```bash
wayland-info | grep -i session_lock
```

一行都没有。

那么结论就很硬了：**KWin 不广播这个接口，所以任何依赖它的客户端都不可能工作**。这不是版本太老、不是编译选项、不是缺个开关。协议没实现，客户端连握手的对象都找不到。我这台是 KWin 6.7.4。

不过「grep 不到」有个平凡的解释：我可能把名字记错了。所以顺手把 `ext_` 开头的都列一遍：

```bash
wayland-info | grep "^interface:" | grep "'ext_"
```

```
interface: 'ext_background_effect_manager_v1', version:  1, name: 58
interface: 'ext_data_control_manager_v1',       version:  1, name: 16
interface: 'ext_idle_notifier_v1',              version:  2, name: 21
```

三个 `ext_*` 都在，会话锁不在。这个组合比空结果有用得多：**KWin 对 `ext-*` 系列不是一概不实现，是挑着实现。**空闲通知它要，会话锁它不要。

顺带一个容易记错的点：空闲那个协议叫 `ext-idle-notify-v1`，但它暴露出来的接口名是 `ext_idle_notifier_v1`——多一个 `r`。grep 的时候按协议名去搜会搜不到，我第一次就栽在这儿。

## 为什么是这样

因为 KDE 早在这个协议出现之前就有自己的一整套锁屏：`kscreenlocker`。它的锁定不走 Wayland 协议，而是 KWin 内部直接接管输入和渲染，外加一个独立的 greeter 进程走 PAM。从 KDE 的角度看，`ext-session-lock-v1` 解决的是他们已经解决了的问题，而且换过去意味着要动一套涉及安全边界的成熟代码。

我不评价这个取舍。**但它对使用者的实际后果是：在 Plasma 上，你没有「换一个锁屏程序」这个选项**。你只有「改造 kscreenlocker」这个选项。

## 所以该往哪走

kscreenlocker 的界面是 QML，而且它从 Plasma 的 shell 包里加载 `contents/lockscreen/`。也就是说锁屏长什么样、怎么判定解锁，都是可以替换的——只是入口不在你以为的地方。

这条路我后来走通了，图片密码锁屏现在跑在真实锁屏上。但它有自己的一串陷阱，包括一个会让**桌面面板凭空消失**的，还有一个软链接导致 greeter 静默回退、日志里零报错的。那些另开一篇写。

这篇只想让搜到它的人早点停手：**别再调 swaylock 的配置了，那条路是死的。**
