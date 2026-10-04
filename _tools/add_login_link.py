# -*- coding: utf-8 -*-
"""add_login_link.py —— 给官网每个页面加「Customer Login」入口（老板 2026-10-04 要的）。

为什么要加：客户手里只有 qelvionbiotech.com，后台却在 my.qelvionbiotech.com。
官网上没有入口的话，客户只能靠我们发给他的那条链接 —— 微信/WhatsApp 记录一删，
他就再也找不到自己的订单了（一定会有客户来问"我的单在哪看"）。

所以放三处，客户从哪儿进都行：
  ① 顶栏：跟「Request a Quote」并排（跟门户的"客户"身份一致）
  ② 手机菜单：客户大概率用手机打开，汉堡菜单里必须有
  ③ 页脚 Company 那一列：手机上翻到底就能看到

幂等：认 data-qv="nav_login" / "nav_login_mobile" / "footer_login"，加过就跳过。
跑法：
  python _tools\\add_login_link.py            # 只看会改哪些文件（不动盘）
  python _tools\\add_login_link.py --apply    # 真的写
  python _tools\\add_login_link.py --check    # 只检查"是不是每个页面都有了"
"""
from __future__ import annotations

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGIN = "https://my.qelvionbiotech.com/portal/login"

PAGES = ["index.html", "index-light.html", "about.html", "catalog.html", "contact.html",
         "privacy.html", "bryan/index.html", "cindy/index.html", "andrew/index.html",
         "hannah/index.html", "steven/index.html"]

# 顶栏：插在「Request a Quote」前面（同一个缩进）。不写死 href/class —— 各页面写法不一样，
# 认的是"第一个" Request a Quote（页头那个；手机菜单里那个在它后面，不受影响）。
RE_HEAD = re.compile(r'([ \t]*)(<a class="btn [^"]*"[^>]*>Request a Quote)')

# 手机菜单：接在 Contact 后面（catalog 那页写的是 index.html#contact / 06，所以编号不写死）
RE_MOBILE = re.compile(r'([ \t]*)(<a href="[^"]*#contact">Contact <small>\d+</small></a>)')
MOBILE_LINE = '<a href="%s" data-qv="nav_login_mobile">Customer Login <small>08</small></a>' % LOGIN

# 页脚：插在 Privacy policy 前面（Company 那一列）
RE_FOOT = re.compile(r'([ \t]*)(<li><a href="privacy\.html"[^>]*>Privacy policy</a></li>)')
FOOT_LINE = '<li><a href="%s" data-qv="footer_login">Customer login</a></li>' % LOGIN


def head_line(text):
    """各页面的次要按钮类名不一样：极光版有 .btn-ghost，子页面只有 .btn-g。"""
    if ".btn-ghost" in text:
        cls = "btn btn-ghost" + (" btn-desktop" if ".btn-desktop" in text else "")
    elif ".btn-g" in text:
        cls = "btn btn-g"
    else:
        cls = "btn"
    return '<a class="%s" href="%s" data-qv="nav_login">Customer Login</a>' % (cls, LOGIN)


def patch(text):
    """返回 (新文本, 做了哪几处)。"""
    did = []
    if 'data-qv="nav_login"' not in text:
        _hl = head_line(text)
        new, n = RE_HEAD.subn(lambda m: "%s%s\n%s%s" % (m.group(1), _hl, m.group(1), m.group(2)),
                              text, count=1)
        if n:
            text = new
            did.append("顶栏")
    if 'data-qv="nav_login_mobile"' not in text:
        new, n = RE_MOBILE.subn(lambda m: "%s%s\n%s%s" % (m.group(1), m.group(2), m.group(1), MOBILE_LINE),
                                text, count=1)
        if n:
            text = new
            did.append("手机菜单")
    if 'data-qv="footer_login"' not in text:
        new, n = RE_FOOT.subn(lambda m: "%s%s\n%s%s" % (m.group(1), FOOT_LINE, m.group(1), m.group(2)),
                              text, count=1)
        if n:
            text = new
            did.append("页脚")
    return text, did


def main():
    apply_ = "--apply" in sys.argv
    check = "--check" in sys.argv
    bad = 0
    for rel in PAGES:
        p = os.path.join(ROOT, rel.replace("/", os.sep))
        if not os.path.exists(p):
            print("  ❌ 找不到 %s" % rel)
            bad += 1
            continue
        with io.open(p, encoding="utf-8") as f:
            text = f.read()
        if check:
            n = sum(1 for k in ('data-qv="nav_login"', 'data-qv="nav_login_mobile"',
                                'data-qv="footer_login"') if k in text)
            # 手机菜单只有那些页面才有（子页面没有汉堡菜单）
            has_menu = 'id="mobileMenu"' in text
            want = 3 if has_menu else 2
            ok = n == want
            print("  %s %-20s 入口 %d/%d%s" % ("✅" if ok else "❌", rel, n, want,
                                               "" if has_menu else "（这页没有手机菜单）"))
            if not ok:
                bad += 1
            continue
        new, did = patch(text)
        if not did:
            print("  跳过 %-20s（已经都有了）" % rel)
            continue
        print("  %s %-20s 加了：%s" % ("✍" if apply_ else "·", rel, "、".join(did)))
        if apply_:
            with io.open(p, "w", encoding="utf-8", newline="") as f:
                f.write(new)
    if check:
        print()
        print("结果：%s" % ("✅ 每个页面都有 Customer Login 入口" if not bad
                            else "❌ %d 个页面有问题" % bad))
        return 1 if bad else 0
    if not apply_:
        print()
        print("（这是预览，什么都没写。要真写就加 --apply）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
