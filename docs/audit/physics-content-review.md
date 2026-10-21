# 课题组网站物理内容审查记录

- 日期：2026-10-21
- 范围：公开研究方向、代表论文索引、登录后的五个学习专题、两体衰变教学脚本，以及自建后端的空库/演示种子数据。
- 状态：已完成一轮源码和公开来源核查；**不等于课题组学术委员会审核，也不等于对列出论文的独立复现**。
- 主要内容文件：frontend/src/content/lab.js、frontend/src/content/learning.js、frontend/public/learning/two_body_decay.py、backend/seed.py。

## 本轮已修正

1. **文献日期字段语义不清。** 原字段 published 实际保存 arXiv 首次提交日期，而 year 在已发表论文中表示期刊引用年份。例如 arXiv:2510.20672 的预印本提交日期为 2025-10-23，期刊记录为 Phys. Rev. D 113, 055041 (2026)。排序字段已改名为 arxivSubmitted；后端 published_date 的含义也已在模型注释中明确为 arXiv 首次提交日期；静态演示数据同步改用 arxivSubmitted，并加入回归测试，防止日期变成 undefined。核对：[arXiv 记录](https://arxiv.org/abs/2510.20672)、[APS 期刊记录](https://doi.org/10.1103/mrm8-qv1j)。
2. **专题与代表论文的关联不完整。** 中微子专题原先没有关联太阳中微子第五力与轴矢量轻子规范相互作用论文；相变专题没有关联暗相变/原初黑洞及标量介导惰性中微子论文；对撞机专题没有关联最新顶夸克自旋关联研究。已补充相关索引，并增加测试检查所有专题引用的 arXiv ID 都存在于论文列表中。
3. **电弱相变表述缺少标准模型基线。** 已明确说明：对约 125 GeV Higgs 的标准模型，电弱热演化为 crossover（平滑交叉过渡），不是一阶相变；强一阶电弱相变通常需要具体的新物理扩展。有限温相变与引力波预言必须说明模型、成核、相变完成和源项假设。标准模型基线参考：[Sphaleron Rate in the Minimal Standard Model, Phys. Rev. Lett. 113, 141602](https://doi.org/10.1103/PhysRevLett.113.141602)；扩展模型的参数依赖参考：[Nonperturbative study of the electroweak phase transition in the real scalar singlet extended standard model, Phys. Rev. D 110, 115016](https://doi.org/10.1103/PhysRevD.110.115016)。
4. **暗物质与中微子专题的实验联系过于概括。** 已补充直接探测对局域暗物质密度、速度分布和核响应的依赖，并说明缪子磁矩等精密观测仅在具体模型存在相应贡献时才构成约束，不能将不同模型的限制直接拼接成通用排除区。
5. **学习专题的零温标量势检查不够完整。** 已补充 Higgs 门户实标量在电弱真空 S=0 处的树级质量平方，并说明正质量平方只检验该方向的局部稳定性，不能单独证明真空为全局最低点。
6. **标准模型规范动能项写法过于压缩。** 已分别写出 SU(3)C、SU(2)L 和 U(1)Y 的规范场强，避免把群指标求和藏在不明确的总和符号中。
7. **FeynCalc 示例的失败路径不明确。** 已把二矩阵迹测试改为不一致时明确报错，并增加四矩阵迹恒等式。示例仍标注为待在本机 Mathematica/FeynCalc 环境实测；没有将预期输出冒充软件实测结果。
8. **演示种子数据把真实 arXiv 编号与错误标题/作者绑定。** 原 backend/seed.py 将 arXiv:2301.07094（计算机视觉论文）与虚构的 JWST 星系巡天标题/作者绑定；将 arXiv:2402.08654（3D 词元图像生成论文）与虚构的天文图像去噪标题/作者绑定。现已改为七篇可追溯的高能粒子物理唯象学论文，覆盖非弹性标量暗物质、标量介导惰性中微子、太阳中微子源第五力、对撞机量子精度、未来 μ 子对撞机长寿命中微子、超轻标量暗物质味耦合和 HL-LHC 的异常 Wtb 耦合；每条记录使用对应的真实 arXiv ID、标题、作者、首次提交日期和来源链接。组会主题与论文关联同步更新。可核对：[2508.13276](https://arxiv.org/abs/2508.13276)、[2509.23925](https://arxiv.org/abs/2509.23925)、[2510.20672](https://arxiv.org/abs/2510.20672)、[2506.10673](https://arxiv.org/abs/2506.10673)、[2409.17243](https://arxiv.org/abs/2409.17243)、[2603.17237](https://arxiv.org/abs/2603.17237)、[2610.04971](https://arxiv.org/abs/2610.04971)。
9. **自建后端的默认教材方向与课题组不匹配，且有占位链接。** 空数据库与演示初始化原先默认写入天体物理、星系形成和宇宙学教材，并带有泛化 GitHub 主题页或占位下载链接。已改为现代粒子物理、量子场论/标准模型教材和 PDG 综述，并使用出版社或官方资源入口：[Modern Particle Physics](https://www.cambridge.org/cc/titles/modern-particle-physics)、[Quantum Field Theory and the Standard Model](https://www.cambridge.org/highereducation/books/quantum-field-theory-and-the-standard-model/A4CD66B998F2C696DCC75B984A7D5799)、[PDG 2026](https://pdg.lbl.gov/2026/)。
10. **PDG 运动学参考版本已过时。** 学习专题原先固定链接到 2025 版。PDG 2026 版现已发布，已将学习资料切换至 [2026 Kinematics PDF](https://pdg.lbl.gov/2026/reviews/rpp2026-rev-kinematics.pdf)，并添加测试防止链接无意间退回旧版本。
11. **个别论文摘要容易把模型提案读成已确立事实。** 已收紧 2604.01304（暗相变催化原初黑洞）、2505.06001（散射纠缠熵与一阶相变诊断）及 2509.23925（惰性中微子与引力波/位移顶点）的摘要措辞，明确它们是特定框架中的模型提案或预测；为控制公开首页的初始 JS 体积，其他论文摘要保持简洁，不将其扩写成未经独立复核的结论。核对来源包括 [2604.01304](https://arxiv.org/abs/2604.01304)、[2505.06001 的 APS 记录](https://journals.aps.org/prd/abstract/10.1103/958t-h23m)、[2509.23925 的 APS 记录](https://journals.aps.org/prd/abstract/10.1103/29kg-f6jb)、[2603.17237 的 APS 记录](https://journals.aps.org/prd/abstract/10.1103/3c9n-gfvj) 和 [2510.20672 的 APS 记录](https://journals.aps.org/prd/abstract/10.1103/mrm8-qv1j)。

12. **核查日期标签曾过度暗示学术审查。** 研究方向页与人员页现使用“资料核查日期”，并明确它不等于独立学术审稿或论文计算复现，避免把来源/索引检查误读成科学结论已经过同行评议。

12. **前端静态演示的组会文献关联和日期失配。** 原 demoData.js 用论文数组下标给组会自动分配文献，导致主题与论文不对应；演示基准日期也停留在 2026-09-10，使 upcoming/completed 状态与当前日期不一致。现已按具体 arXiv ID 建立五场组会与五篇唯象学论文的一一关联，基准日期更新为 2026-10-21，日历模块的冻结日期也改为引用同一基准常量，避免演示日历与组会数据再次漂移；并补充测试检查文献存在性、主题领域、日期/状态一致性和资料分类。静态工作台演示资源库聚焦量子场论/标准模型教材与 PDG；对外研究资源页继续提供 arXiv、INSPIRE、HEPData、FeynCalc 等公开工具入口。演示成员、互动、排期仍是虚构数据，不能被理解为真实课题组安排。

## 已核对的公式与适用范围

### 1. 标量门户势的树级有界条件

在网站所用约定
\[
V_4=\lambda_H x^2+\frac{\lambda_S}{4}y^2+\frac{\lambda_{HS}}{2}xy,\qquad
x=H^\dagger H\ge0,\quad y=S^2\ge0,
\]
下，
\[
V_4=\left(\sqrt{\lambda_H}x-\frac{\sqrt{\lambda_S}}{2}y\right)^2+
\left(\frac{\lambda_{HS}}{2}+\sqrt{\lambda_H\lambda_S}\right)xy.
\]
因此严格四次势有界条件为
\[
\lambda_H>0,\qquad \lambda_S>0,\qquad
\lambda_{HS}>-2\sqrt{\lambda_H\lambda_S}.
\]
等号对应可能的平坦方向，应单独分析。该条件是树级大场势的条件，不代替全局真空比较、圈级修正或 RG 演化。

在 H†H=v²/2、S=0 的电弱真空处，
\[
m_{S,\mathrm{tree}}^2=\mu_S^2+\frac{\lambda_{HS}}{2}v^2,\qquad
m_{h,\mathrm{tree}}^2=2\lambda_Hv^2.
\]
其中 mS²>0 是 S=0 方向局部稳定的必要条件，但不是全局真空稳定性的充分条件。

### 2. 两体衰变宽度

对于静止系中角度无关的振幅，
\[
p_*=\frac{\sqrt{[M^2-(m_1+m_2)^2][M^2-(m_1-m_2)^2]}}{2M},\qquad
\Gamma=\frac{p_*|\mathcal M|^2}{8\pi M^2 S},
\]
其中 S=1 对应可区分末态，两个相同末态时 S=2。教学脚本的相互作用为 Lint = −gXab，三种实标量互不相同，因此 |M|=|g|，g 的质量维数为 1，宽度 Γ 的质量维数为 1。相空间归一化按 [PDG 2026 Kinematics §49.4–49.4.2](https://pdg.lbl.gov/2026/reviews/rpp2026-rev-kinematics.pdf) 核对，未重复乘入 (2π)^4。

### 3. FeynCalc 的范围限制

二矩阵迹
\[
\mathrm{Tr}(\gamma^\mu\gamma^\nu)=4g^{\mu\nu}
\]
与四矩阵迹只用于四维、无 γ5 的入门检查。它们不能验证圈图的维数正则化、γ5 方案、反项或 UV–EFT 匹配。参考：[FeynCalc DiracTrace](https://feyncalc.github.io/FeynCalcBook/DiracTrace)、[DiracSimplify](https://feyncalc.github.io/FeynCalcBook/DiracSimplify.html)。

## 仍然明确未完成的事项

- 五个公开方向目前是研究范围概述，不是经过同行评审的专题综述。
- 五个学习专题仍为初稿，学术维护者待课题组指定。
- FeynCalc 示例没有在本机 Mathematica/FeynCalc 安装环境运行；网站不提供 Mathematica 云端执行。
- 两体衰变脚本的内置测试属于实现一致性检查，不是独立研究结果复现。
- 本轮没有新增参数扫描、实验排除图、数值灵敏度曲线或新的物理结论。
- 代表论文元数据已针对官方 arXiv、INSPIRE 与 APS 记录抽查；任何论文的模型假设、数值结果和结论仍应以原文为准。
- backend/seed.py 只影响空数据库初始化或显式启用的演示初始化；不会自动改写已有数据库记录，也不会直接修改当前 Cloudflare Pages/D1 生产数据。若要清理已有线上资料，须另行检查当前 D1 内容并设计有备份/回滚的迁移。

## 验收要求

- 自动测试须检查每个专题引用的论文 ID 都存在。
- 学习页所有新增公式须通过 KaTeX 渲染测试。
- CI 必须针对本次分支的最新提交重新运行；旧提交的绿灯不作为本次验收证据。
- 合并和生产部署仍需单独批准；本次只更新分支源码与审查记录，不直接修改生产网站。
