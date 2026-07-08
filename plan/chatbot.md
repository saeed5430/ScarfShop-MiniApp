````md
# AI Chat Assistant UI/UX Specification

## Overview

Design a premium AI chat experience for a Telegram Mini App used by wholesale scarf buyers.

The experience should feel modern, elegant, smooth and intelligent.

The interface must make users feel they are interacting with an advanced AI assistant rather than a traditional chatbot.

---

# General Requirements

- Language: Persian (Farsi)
- Direction: RTL
- Mobile First
- Telegram Mini App optimized
- Modern & Premium Design
- Soft animations
- Smooth transitions
- High FPS animations
- Responsive on all mobile sizes

---

# Overall Feeling

The user should feel:

- Fast
- Intelligent
- Minimal
- Premium
- Friendly
- Alive

Avoid feeling like:

❌ Old messenger

❌ Static page

❌ Basic support chat

---

# Layout

```
Header

Conversation

Typing Indicator

Suggestions

Input Box
```

The input area should always remain visible.

---

# Header

Display:

- AI Avatar
- Assistant Name
- Online Status
- Conversation Menu

Example

```
🤖 AI Assistant

● Online

──────────────
```

---

# Online Status

Display one of:

🟢 Online

🟡 Thinking

⚫ Offline

Status should animate.

Example

Green dot with soft pulse animation.

When AI is generating:

Dot changes to orange.

When unavailable:

Gray.

---

# Avatar

Modern circular avatar.

Should have a subtle glowing border.

While AI is responding:

Glow slowly pulses.

---

# Conversation Area

Messages should appear as cards.

Assistant messages:

- light background
- rounded corners
- maximum readability

User messages:

- primary color
- white text

Spacing between messages:

16px

Rounded radius:

20px

---

# Message Animation

Every new message should:

Fade In

+

Slide Up

Duration:

180ms

No instant appearance.

---

# Streaming Response

The response should appear gradually.

Instead of:

Entire message appears instantly.

Use streaming.

Characters should appear progressively.

The user should feel AI is actually thinking.

---

# Typing Indicator

Before every response show:

```
● ● ●
```

Animated bouncing dots.

Animation repeats smoothly.

Disappear immediately after first streamed token.

---

# Thinking State

If response generation takes more than 400ms

Display

```
AI is thinking...
```

with animated dots.

Never leave the interface frozen.

---

# Suggested Questions

When conversation starts

Show suggestion chips.

Example:

- قیمت روسری نخی
- موجودی محصول
- ثبت سفارش
- پرفروش‌ترین مدل
- رنگ‌های موجود

Tap once

Immediately sends prompt.

---

# Input Box

Rounded

Large

52px height

Supports:

- Multi-line
- Auto Grow
- Send Button
- Character counter (optional)

Placeholder:

```
پیام خود را بنویسید...
```

---

# Send Button

Initially disabled.

Enable only when text exists.

Animation:

Scale

Opacity

Hover (Desktop)

Tap feedback (Mobile)

---

# Scroll Behavior

Always scroll smoothly.

When AI replies

Automatically move to latest message.

No jump.

Smooth animation.

---

# Copy Button

Each AI message should have

Copy

icon.

Tap

Copies message.

Show

Toast

```
پیام کپی شد
```

---

# Markdown Rendering

Assistant messages should support:

- Headings
- Bold
- Lists
- Code Block
- Tables
- Links

Beautiful typography.

---

# Code Blocks

Use syntax highlighting.

Rounded container.

Horizontal scrolling.

Copy button.

---

# Images

Assistant may return images.

Display:

Rounded

Lazy Loaded

Tap

Fullscreen Viewer

Pinch Zoom

---

# Error State

If request fails

Display friendly message.

Example

```
ارتباط با سرور برقرار نشد

تلاش مجدد
```

Retry button.

---

# Empty State

First launch

Display welcome screen.

Example

```
سلام 👋

من دستیار هوشمند فروشگاه هستم.

می‌توانم درباره محصولات،
موجودی،
ثبت سفارش،
و پیشنهاد خرید به شما کمک کنم.
```

---

# Loading Experience

Never use traditional spinner.

Instead use:

Skeleton

Typing

Streaming

Thinking State

---

# AI Personality

Friendly

Professional

Helpful

Short answers

Easy to read

No huge text walls.

---

# Conversation Memory

Keep previous messages visible.

Smooth scrolling.

No page reload.

---

# Quick Actions

Above input

Optional action chips.

Examples:

📦 محصولات

💰 قیمت

🎨 رنگ‌ها

📍 سفارش

🔥 تخفیف

---

# Floating Scroll Button

When user scrolls up

Show floating button

↓

Tap

Jump to latest message.

Animated.

---

# Notification Effects

When AI finishes responding

Subtle haptic feedback (Telegram supported devices)

+

Small fade animation.

Avoid aggressive effects.

---

# Micro Interactions

Every interaction should feel alive.

Examples:

- Button scale
- Card hover
- Ripple effect
- Smooth opacity
- Icon rotation
- Soft glow
- Message fade
- Expand animation
- Toast slide
- Modal blur

Nothing should feel static.

---

# Colors

Background

Very light

Cards

White

Primary

Purple

Accent

Telegram theme color

Online

Green

Thinking

Orange

Offline

Gray

Error

Red

---

# Performance

- Lazy render messages
- Virtualize long conversations
- Optimistic UI
- Smooth 60 FPS animations
- Debounced input
- Image lazy loading
- Preserve scroll position
- No unnecessary re-renders

---

# Accessibility

- RTL support
- Dynamic font size
- High contrast
- Screen reader labels
- Large tap targets
- Keyboard friendly

---

# Premium Details

Small details make the experience memorable.

Examples:

✓ Animated online indicator

✓ AI avatar glow while responding

✓ Streaming text generation

✓ Elegant typing indicator

✓ Glassmorphism modals (subtle)

✓ Soft shadows

✓ Smooth transitions

✓ Beautiful empty state

✓ Animated suggestion chips

✓ Modern toast notifications

✓ Premium image viewer

✓ Delightful micro interactions

The final result should feel comparable to modern AI chat interfaces while remaining lightweight, fast, and perfectly integrated into a Telegram Mini App.
````
