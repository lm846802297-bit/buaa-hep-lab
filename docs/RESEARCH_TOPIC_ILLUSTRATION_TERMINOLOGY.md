# 五个研究专题插图：文字与物理术语核对清单

**状态：** PR #20 的插图校对基线。此文档定义文字与图意边界；不代表专题正文或任何物理计算已通过独立复现。

## 总则

1. **图像模型不负责绘制最终文字。** 可见文字直接写入 SVG 的 `<text>` / `<tspan>`，从而可以逐字检查拼写、希腊字母和下标。
2. **可见文字使用白名单。** `frontend/scripts/topic-illustration-terms.json` 是自动化检查使用的机器可读基准；新增标签必须先更新清单并审查物理含义。
3. **没有数据就不画成数据。** 五张图中的曲线、网格、颜色和探测器形状均为概念构图，不是实验事件显示、数值求解、拟合结果或定量预测。页面图注也明确说明这一点。
4. **不在插图里放未经核查的复杂公式。** 五张图使用少量手工编写的英文标题和对象标签；中微子图只保留 `ν_e`、`ν_μ`、`ν_τ`、`ν_1`、`ν_2`、`ν_3` 与 `L/E` 等基础符号；量子计量图的 `x`、`y`、`z` 是 Bloch 球坐标示意，`θ` 是测量分布横轴的示意标记。标签不承载任何数值预测。
5. **符号约定：** 中微子味态写作 `ν_e`、`ν_μ`、`ν_τ`；质量本征态写作 `ν_1`、`ν_2`、`ν_3`。SVG 使用 `<tspan baseline-shift="sub">` 实际排版下标，不能把下标依赖字体猜测或拼成普通基线字符。插图的矩阵区只标为 `PMNS MIXING MATRIX`，不显示或暗示任何矩阵元数值；在正文公式中，PMNS 矩阵可按规范记作 `U_PMNS`。

## 逐图核对

| 专题 | 标题与核对术语 | 最终 SVG 可见文字（逐字白名单） | 必须明确的限制 |
|---|---|---|---|
| 暗物质与暗扇区 | 暗物质直接探测、暗物质晕、靶核、核反冲、液氙探测器 | `DARK MATTER DIRECT DETECTION`；`Dark Matter Halo`；`Target Nucleus`；`Nuclear Recoil`；`Liquid Xenon Detector` | 底部曲线无数值刻度，不代表实验数据或特定模型的定量预测；不指定暗物质质量、耦合、核响应或探测效率。 |
| 中微子与新相互作用 | 中微子味态、质量本征态、中微子振荡、PMNS 混合矩阵、`L/E` | `NEUTRINO OSCILLATION`；`FLAVOR STATES`；`PMNS MIXING MATRIX`；`ν_e`、`ν_μ`、`ν_τ`；`ν_1`、`ν_2`、`ν_3`；`MASS EIGENSTATES`；`L/E` | 矩阵色块没有数值，不代表 PMNS 矩阵元或其模方；波形不是指定振荡参数下的概率计算。图中的 `L/E` 没有单位、刻度或拟合结果。味态标签使用下标排版，不能将 `νe` 当作最终视觉排版。 |
| 对撞机唯象 | 探测器层、粒子径迹、碰撞顶点、缺失横动量 | `COLLIDER EVENT DISPLAY`；`Detector Layers`；`Particle Tracks`；`Interaction Vertex`；`Missing Transverse Momentum` | 未指定具体实验、探测器、重建算法或事件拓扑；右下曲线图不对应真实事件或模拟样本。缺失横动量标签仅标识概念示意，不代表真实重建量。 |
| 相变与引力波 | 宇宙相变、真空泡成核、泡扩张、泡碰撞、引力波 | `COSMOLOGICAL PHASE TRANSITION`；`Bubble Nucleation`；`Bubble Expansion`；`Bubble Collision`；`Gravitational Waves` | 波形与频谱不是数值预测；没有定量区分泡壁碰撞、声波和湍流的贡献。不能从插图反推出 `Ω_{GW}(f)` 或任何相变参数。 |
| 量子计量 | Bloch 球、量子态、自旋关联、费舍尔信息、测量分布 | `QUANTUM METROLOGY`；`Bloch Sphere`；`Quantum State`；`Spin Correlations`；`Measurement Distribution`；`Fisher Information (conceptual)`；坐标符号 `x`、`y`、`z`、`θ` | 曲线没有数据、参数或数值刻度，不表示费舍尔信息或量子费舍尔信息的计算结果；示意图本身不构成量子态纠缠的证据。坐标标签应与图中的投影轴/横轴对应。 |


## 自动化验收

- `frontend/scripts/check-topic-illustrations.mjs` 使用 Python 标准库 XML 解析器检查 SVG 是否为良构 XML。
- 校验每张 SVG 的 `title`、`desc`、可见文字、下标标记、唯一 ID 和 `aria-labelledby`。
- 校验专题页面的 `alt` 文本与机器可读清单一致。
- `npm test` 与 `npm run build` 均会执行插图检查；浏览器烟测会检查五张图在实际页面中均成功加载。
- 若物理图意发生变化，必须同时更新 SVG、机器可读清单、此文档及测试，不能只改其中一项。

## 本次校对记录

- 所有新增英文标签均直接写在 SVG 的 `<text>` 元素中，采用固定的手工字符串；不使用 AI 生图生成文字，不将标签烘焙到位图。
- 英文采用短语而非长公式，以减少缩放后的拥挤和字体/下标歧义；标题、标签及无数据声明在图外的可访问描述中分别管理。
- 中微子图使用 `ν_e`、`ν_μ`、`ν_τ` 与 `ν_1`、`ν_2`、`ν_3` 的 SVG 下标排版。矩阵色块只是结构示意，不展示任何未经计算的 PMNS 元素。
- 对撞机图中的 `Missing Transverse Momentum` 是概念标签，不代表真实事件重建；相变图没有绘制带数值轴的 `Ω_{GW}(f)` 曲线；量子计量图明确将 Fisher 信息标为概念性内容。
- 机器可读白名单位于 `frontend/scripts/topic-illustration-terms.json`。任何可见文字变化必须同步更新该文件，并通过 `npm test` / `npm run build` 中的插图检查。

## 物理范围说明

这些插图用于帮助读者识别研究对象，不是教材级的完整物理图，也不替代公式推导。特别是中微子图中的矩阵色块没有数值含义；相变图没有指定模型参数；暗物质图没有采用某个实验的能量响应；量子计量图没有给出量子态、测量算符或 Fisher 信息的计算定义。正式科研结论必须回到正文中的明确定义、数据来源与可复现计算。
