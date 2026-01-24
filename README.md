# Logic Bingo ![上次更新](https://img.shields.io/github/last-commit/typed-sigterm/logic-bingo/main?label=%E4%B8%8A%E6%AC%A1%E6%9B%B4%E6%96%B0) ![许可证](https://img.shields.io/github/license/typed-sigterm/logic-bingo?label=%E8%AE%B8%E5%8F%AF%E8%AF%81) ![OSS Lifecycle](https://img.shields.io/osslifecycle?file_url=https%3A%2F%2Fraw.githubusercontent.com%2Ftyped-sigterm%2Flogic-bingo%2Fmain%2FOSSMETADATA) [![GitHub Stars](https://img.shields.io/github/stars/typed-sigterm/logic-bingo)](https://github.com/typed-sigterm/logic-bingo)

求解、验证、设计逻辑 Bingo。

👉 [立即体验](https://logic-bingo.by-ts.top)

## 什么是逻辑 Bingo

Bingo 是一种经典游戏，以最简单的美式宾果玩法为例：每个玩家获得不同的带数字 1~75 的 5×5 卡片，玩家在自己的卡片上标记出主持人抽出的号码，最先在水平、垂直或对角线上连线者获胜。

逻辑 Bingo 是一种变体，像这样：

| | 1 | 2 | 3 | 4 | 5 |
|:-:|:-:|:-:|:-:|:-:|:-:|
| 1 | 这个格子应该打勾 | 整张表打勾的格子数 ≤12 | 第 2 列打勾格子数量小于第 3 列 | 这一格所在行打勾格子数量小于所在列 | 答案中 5 个连成一线的格子是一整列 |
| 2 | 这个格子周围 5 格中打勾的格子个数是奇数 | 整张表打勾的格子个数 ≥13 | 不存在周围格子均未被打勾的格子 | 表格四个角上的格子恰有 2 个打勾 | 答案中 5 个连成一线的格子是一整行 |
| 3 | 中心格被打勾 | 左上角的九宫格有 ≥5 个格子打勾 | 不存在上下相邻且均被打勾的两个格子 | 不存在上下左右均勾但自身不勾的格子 | 答案中 5 个连成一线的格子是斜对角线 |
| 4 | 存在某个格子周围打勾格子数量 ≥7 | 这一格所在行打勾格子数量小于所在列 | 存在 4 个格子均被打勾的 2×2 正方形 | 这个格子周围 8 格中打勾的格子数量是偶数 | √ |
| 5 | 第 5 列打勾格子数量 <3 | 第 2 列打勾格子数量 >3 | 第 1 列打勾格子数量 >3 | 第 3 列打勾格子数量在所有列中最小 | 存在一整行或一整列没有打勾的格子 |

解题者需要找出一个打勾方案，使得所有格子的逻辑条件均成立，同时在水平、垂直或对角线上连线。

无论是求解、验证还是设计逻辑 Bingo，都需要较强的逻辑能力和耐心。

逻辑 Bingo 是一种布尔满足问题，计算机可以快速求解。本项目旨在提供一个工具，帮助用户求解、验证和设计逻辑 Bingo。

## 功能

- 求解逻辑 Bingo
- 验证逻辑 Bingo 解答
- 设计逻辑 Bingo 题目（WIP）

所有计算均在您的浏览器中完成，无需上传数据到服务器。不过正因如此，需要加载约 10MB 的求解模块，速度取决于您的网络状况和设备性能。

特别感谢 Microsoft Research 和其他贡献者开发的 [Z3 Theorem Prover](https://github.com/Z3Prover/z3)，本项目的数学功能依赖于 Z3。
