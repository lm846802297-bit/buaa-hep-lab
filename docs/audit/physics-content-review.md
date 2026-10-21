# 课题组网站物理内容审查记录

- 日期：2026-10-21
- 范围：公开研究方向、代表论文索引、登录后的五个学习专题、两体衰变教学脚本。
- 状态：已完成一轮源码与公开来源核查；**不等于课题组学术委员会审核，也不等于对列出论文的独立复现**。
- 主要内容文件：`frontend/src/content/lab.js`、`frontend/src/content/learning.js`、`frontend/public/learning/two_body_decay.py`、`backend/seed.py`（仅用于自建后端的初始化/演示数据）。

## 本轮已修正

1. **文献日期字段语义不清。** 原字段 `published` 实际保存 arXiv 首次提交日期，而 `year` 在已发表论文中表示期刊引用年份。例如 arXiv:2510.20672 的预印本提交日期为 2025-10-23，但期刊记录是 *Phys. Rev. D* 113, 055041 (2026)。已将排序字段改名为 `arxivSubmitted`，并保留 `year` 作为引用年份，避免将预印本提交时间误读为期刊发表时间。核对：[arXiv:2510.20672](https://arxiv.org/abs/2510.20672)、[APS 期刊记录](https://doi.org/10.1103/mrm8-qv1j)。
2. **专题—论文关联不完整。** 中微子专题原先没有关联太阳中微子第五力与轴矢量轻子规范相互作用论文；相变专题没有关联暗相变/原初黑洞及标量介导惰性中微子论文；对撞机专题没有关联最新的顶夸克自旋关联研究。已补充相关索引，并添加自动测试，确保每个专题引用的 arXiv ID 都存在于论文列表中。
3. **电弱相变表述缺少标准模型基线。** 已明确说明：对已知 Higgs 质量约 125 GeV 的标准模型，电弱热演化是 crossover（平滑交叉过渡），不是一阶相变；强一阶相变通常需要具体新物理扩展。有限温相变与引力波预言必须说明模型、成核和源项假设。参考：[非微扰研究（Phys. Rev. D 110, 115016）](https://doi.org/10.1103/PhysRevD.110.115016)。
4. **暗物质与中微子专题的实验联系过于概括。** 已补充直接探测的局域晕密度/速度分布/核响应依赖，并说明缪子磁矩等精密观测仅在具体模型有相应贡献时才构成约束，不能将不同模型的约束直接拼接。
5. **学习专题的零温标量势检查不够完整。** 已补充 Higgs 门户实标量在电弱真空 (S=0) 处的树级质量平方
   [
   m_{S,\mathrm{tree}}^2=\mu_S^2+\frac{\lambda_{HS}}{2}v^2,
   \]
   并说明正质量平方只检验该方向的局部稳定性，不能单独证明真空为全局最低点。
6. **标准模型规范动能项写法过于压缩。** 已把 (SU(3)_C)、(SU(2)_L) 和 (U(1)_Y) 的规范场强分别写出，避免把群指标求和藏在不明确的总和符号中。
7. **FeynCalc 示例的失败路径不明确。** 已把二矩阵迹测试改为不一致时明确报错，并增加四矩阵迹恒等式。该示例仍标注为“待在本机 Mathematica/FeynCalc 环境实测”，没有将预期输出冒充实测结果。

6. **演示种子数据的论文元数据错配。** 原 `backend/seed.py` 将 arXiv:2301.07094（实际为计算机视觉论文）与虚构的 JWST 星系巡天标题/作者绑定，并将 arXiv:2402.08654（实际为 3D 词元图像生成论文）与虚构的天文图像去噪标题/作者绑定。已将两条演示推荐改为课题组可追溯的真实论文 arXiv:2508.13276 与 arXiv:2509.23925，并同步更新演示组会主题与摘要。原始记录可在 [arXiv:2301.07094](https://arxiv.org/abs/2301.07094) 与 [arXiv:2402.08654](https://arxiv.org/abs/2402.08654) 核对。
7. **自建后端的默认教材方向不匹配。** 空数据库初始化和演示初始化原先默认写入天体物理、星系形成和宇宙学教材。已改为粒子物理教材、量子场论/标准模型教材及 PDG 综述，并使用出版社或官方资源链接：[Modern Particle Physics](https://www.cambridge.org/cc/titles/modern-particle-physics)、[Quantum Field Theory and the Standard Model](https://www.cambridge.org/highereducation/books/quantum-field-theory-and-the-standard-model/A4CD66B998F2C696DCC75B984A7D5799)、[PDG 2025](https://pdg.lbl.gov/2025/)。
8. **既有数据库的限制。** 上述 `backend/seed.py` 变更只影响空数据库初始化或显式启用的演示初始化，不会自动改写已经存在的数据库记录；当前 Cloudflare Pages/D1 生产数据也不会被此 Python seed 文件直接修改。若要清理既有线上资料，必须另行检查当前 D1 内容并设计有备份/回滚的迁移。

## 已核对的公式与适用范围

### 1. 标量门户势的树级有界条件

在网站所用约定
[
V_4=\lambda_H x^2+\frac{\lambda_S}{4}y^2+\frac{\lambda_{HS}}{2}xy,
\qquad x=H^\dagger H\ge0,\quad y=S^2\ge0,
\]
下，
[
V_4=\left(\sqrt{\lambda_H}x-\frac{\sqrt{\lambda_S}}2y\right)^2
+\left(\frac{\lambda_{HS}}2+\sqrt{\lambda_H\lambda_S}\right)xy.
\]
因此严格四次势有界条件为
[
\lambda_H>0,\qquad\lambda_S>0,\qquad
\lambda_{HS}>-2\sqrt{\lambda_H\lambda_S}.
\]
等号对应可能的平坦方向，应单独分析。该条件是树级大场势的条件，不代替全局真空比较、圈级修正或 RG 演化。

### 2. 两体衰变宽度

对于静止系中角度无关的振幅，
[
p_* = \frac{\sqrt{[M^2-(m_1+m_2)^2][M^2-(m_1-m_2)^2]}}{2M},
\qquad
\Gamma=\frac{p_*|\mathcal M|^2}{8\pi M^2 S},
\]
其中 (S=1) 对应可区分末态，两个相同末态时 (S=2)。随附代码的相互作用为 (\mathcal L_{\rm int}=-gXab)，三种实标量互不相同，故 (\mathcal M) 的模为 (g)，且 (g) 的质量维数为 1；结果 (\Gamma\) 的质量维数为 1。相空间归一化按 [PDG 2025 Kinematics §49.4–49.4.2](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-kinematics.pdf) 处理，未重复乘入 ((2\pi)^4)。

### 3. FeynCalc 的范围限制

二矩阵迹 (\mathrm{Tr}(\gamma^\mu\gamma^\nu)=4g^{\mu\nu}) 与四矩阵迹仅用于四维、无 (\gamma^5) 的入门检查。它们不能验证圈图的维数正则化、(\gamma^5) 方案、反项或 UV–EFT 匹配。参考：[FeynCalc DiracTrace](https://feyncalc.github.io/FeynCalcBook/DiracTrace)、[DiracSimplify](https://feyncalc.github.io/FeynCalcBook/DiracSimplify.html)。

## 仍然明确未完成的事项

- 五个公开方向目前是研究范围概述，不是经过同行评审的专题综述。
- 五个学习专题仍为初稿，学术维护者待课题组指定。
- FeynCalc 示例没有在本机 Mathematica/FeynCalc 安装环境运行；网站不提供 Mathematica 云端执行。
- 两体衰变脚本的内置测试属于实现一致性检查，不是独立研究结果复现。
- 本轮没有新增参数扫描、实验排除图、数值灵敏度曲线或新的物理结论。
- 代表论文元数据已针对官方 arXiv、INSPIRE 与 APS 记录进行抽查；任何论文的模型假设、数值结果和结论仍应以原文为准。

## 验收要求

- 自动测试须检查每个专题引用的论文 ID 都存在。
- 学习页所有新增公式须通过 KaTeX 渲染测试。
- CI 必须针对本次分支的最新提交重新运行；旧提交的绿灯不作为本次验收证据。
- 合并和生产部署仍需单独批准；本次只更新分支源码与审查记录，不直接修改生产网站。
