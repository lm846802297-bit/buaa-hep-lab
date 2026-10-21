import json
from datetime import datetime
from sqlalchemy.orm import Session

from .database import Base, SessionLocal, engine
from .models import ArxivPaper, InviteCode, PaperReadMark, ResourceBook, SeminarSchedule, User

from .auth import get_password_hash


import os
import sys

def init_clean_db(reset: bool = False):
    """
    初始化生产环境干净数据库：
    - 保留管理员账号与邀请码
    - 保留学术教材专著资源
    - 清理/不添加任何模拟学生、导师、测试排期及文献
    """
    from .migrations import migrate
    from .database import Base, SessionLocal, engine

    if reset:
        print("正在重置数据库结构...")
        Base.metadata.drop_all(bind=engine)

    migrate(engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@example.com")
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            print("创建系统管理员账号...")
            admin = User(
                name="系统管理员",
                email=admin_email,
                hashed_password=get_password_hash(os.getenv("ADMIN_PASSWORD", "123456")),
                role="admin",
                can_manage_seminars=True,
                tutorial_completed=False,
                bio="LabOrbit 课题组协作平台系统管理",
            )
            db.add(admin)
            db.commit()
            print(f"管理员账号已创建: {admin_email}")

        # 初始化默认邀请码（若 invite_codes 表为空）
        primary_code = os.getenv("LABHUB_INVITE_CODE", "LAB-2026")
        if db.query(InviteCode).count() == 0:
            admin_user = db.query(User).filter(User.email == admin_email).first()
            for code_str, note in [
                (primary_code, "默认注册邀请码"),
            ]:
                if not db.query(InviteCode).filter(InviteCode.code == code_str).first():
                    db.add(InviteCode(
                        code=code_str,
                        note=note,
                        created_by_id=admin_user.id if admin_user else None,
                        is_active=True,
                    ))
            db.commit()

        if db.query(ResourceBook).count() == 0:
            print("初始化高能粒子物理参考资料...")
            books = [
                ResourceBook(
                    title="现代粒子物理 (Modern Particle Physics)",
                    original_title="Modern Particle Physics",
                    authors="Mark Thomson",
                    category="基础理论与专著",
                    description="面向高年级本科生与研究生的粒子物理教材，涵盖衰变与截面、标准模型、希格斯、QCD、中微子和标准模型之外的新物理。阅读时仍须结合最新实验数据与勘误。",
                    cover_url="",
                    tutorial_url="https://www.cambridge.org/cc/titles/modern-particle-physics",
                    exercise_url="",
                    github_url="",
                    download_url=None,
                    order_num=1,
                ),
                ResourceBook(
                    title="量子场论与标准模型 (Quantum Field Theory and the Standard Model)",
                    original_title="Quantum Field Theory and the Standard Model",
                    authors="Matthew D. Schwartz",
                    category="基础理论与专著",
                    description="研究生层次的量子场论教材，系统讨论散射与衰变、费曼规则、重整化、规范理论、标准模型、有效场论和重整化群。",
                    cover_url="",
                    tutorial_url="https://www.cambridge.org/highereducation/books/quantum-field-theory-and-the-standard-model/A4CD66B998F2C696DCC75B984A7D5799",
                    exercise_url="",
                    github_url="",
                    download_url=None,
                    order_num=2,
                ),
                ResourceBook(
                    title="粒子物理评论 (Review of Particle Physics, 2026)",
                    original_title="Review of Particle Physics (2026)",
                    authors="Particle Data Group",
                    category="实验数据与综述",
                    description="粒子性质、标准模型综述、实验方法和新粒子搜索的权威入口。引用数值或限制时必须记录具体版本、条目和勘误；旧版数据不自动代表当前限制。",
                    cover_url="",
                    tutorial_url="https://pdg.lbl.gov/2026/",
                    exercise_url="",
                    github_url="",
                    download_url=None,
                    order_num=3,
                ),
            ]
            db.add_all(books)
            db.commit()

        print("==================================================")
        print("🎉 干净生产数据库已准备就绪！")
        print(f"🔑 初始管理员: {admin_email} / 初始密码: {os.getenv('ADMIN_PASSWORD', 'lab123456')}")
        print("🎟️ 组内注册邀请码: LAB-2026")
        print("💡 建议首次登录后在个人中心修改密码。")
        print("==================================================")
    finally:
        db.close()



def _seed_default_invite_codes(db: Session) -> None:
    """确保数据库中至少有一条默认邀请码（幂等操作）。"""
    if db.query(InviteCode).count() > 0:
        return
    primary_code = os.getenv("LABHUB_INVITE_CODE", "LAB-2026")
    admin_user = db.query(User).filter(User.role == "admin").first()
    if not db.query(InviteCode).filter(InviteCode.code == primary_code).first():
        db.add(InviteCode(
            code=primary_code,
            note="默认注册邀请码",
            created_by_id=admin_user.id if admin_user else None,
            is_active=True,
        ))
        db.commit()
        print(f"🎟️ 默认邀请码已写入数据库: {primary_code}")


def _seed_demo_data(db: Session) -> None:
    """Create synthetic demo users/events, while keeping paper metadata tied to real sources."""
    print("开始初始化课题组基础演示数据 (SEED_DEMO_DATA=1)...")
    try:
        # 1. 成员与老师用户
        admin = User(
            name="系统管理员",
            email="admin@lab.edu",
            hashed_password=get_password_hash("lab123456"),
            role="admin",
            bio="课题组网站系统管理",
        )
        prof_shu = User(
            name="导师 (PI)",
            email="shu@lab.edu",
            hashed_password=get_password_hash("lab123456"),
            role="teacher",
            bio="课题组负责人",
        )
        prof_wang = User(
            name="合作导师",
            email="wang@lab.edu",
            hashed_password=get_password_hash("lab123456"),
            role="teacher",
            bio="暗物质与暗扇区唯象学（演示数据）",
        )
        prof_li = User(
            name="青年教师",
            email="li@lab.edu",
            hashed_password=get_password_hash("lab123456"),
            role="teacher",
            bio="中微子与新相互作用（演示数据）",
        )
        student1 = User(
            name="张明 (博士生)",
            email="student@lab.edu",
            hashed_password=get_password_hash("lab123456"),
            role="student",
            can_manage_seminars=True,
            bio="暗物质唯象学与数值计算方向（演示数据）",
        )
        admin_example = User(
            name="测试管理员",
            email="admin@example.com",
            hashed_password=get_password_hash("123456"),
            role="admin",
            can_manage_seminars=True,
            bio="测试专用管理员",
        )

        db.add_all([admin, admin_example, prof_shu, prof_wang, prof_li, student1])
        db.commit()
        db.refresh(prof_shu)
        db.refresh(student1)

        # 2. arXiv 推荐文献：全部使用课题组高能粒子物理唯象学方向的真实公开论文
        # published_date 记录 arXiv 首次提交日期；journal 单独记录期刊发表信息。
        paper1 = ArxivPaper(
            arxiv_id="2508.13276",
            title="Probing Purely Inelastic Scalar Dark Matter Across Colliders and Gravitational Wave Observatories",
            authors=json.dumps(["Jinhui Guo", "Jia Liu", "Chenhao Peng", "Xiao-Ping Wang"], ensure_ascii=False),
            abstract="We study a purely inelastic scalar dark matter scenario and its complementary phenomenology in relic abundance, electroweak phase transitions, gravitational-wave prospects, and long-lived collider signatures. The predictions depend on the mass splitting and the model parameter choices.",
            journal="Phys.Rev.D 112 (2025) 115014",
            source_url="https://arxiv.org/abs/2508.13276",
            primary_category="hep-ph",
            published_date="2025-08-18",
            pdf_url="https://arxiv.org/pdf/2508.13276.pdf",
            recommended_by_id=prof_shu.id,
            recommend_comment="阅读重点：热共湮灭条件、暗物质质量分裂、一阶相变与长寿命粒子信号。请区分 benchmark、完整参数空间和未来灵敏度预测。",
            is_pinned=True,
        )

        paper2 = ArxivPaper(
            arxiv_id="2509.23925",
            title="Probing Scalar-Mediated Sterile Neutrinos with Gravitational Wave and Colliders Signals",
            authors=json.dumps(["Qi Bi", "Jinhui Guo", "Jian Liao", "Jia Liu", "Xiao-Ping Wang"], ensure_ascii=False),
            abstract="We study a scalar-mediated sterile-neutrino model and compare its model-dependent electroweak phase-transition gravitational-wave prospects with long-lived sterile-neutrino searches through displaced vertices at colliders.",
            journal="Phys.Rev.D 113 (2026) 095006",
            source_url="https://arxiv.org/abs/2509.23925",
            primary_category="hep-ph",
            published_date="2025-09-28",
            pdf_url="https://arxiv.org/pdf/2509.23925.pdf",
            recommended_by_id=student1.id,
            recommend_comment="讨论 Higgs–标量混合、惰性中微子寿命、相变完成条件和位移顶点接受度；灵敏度预测不等于观测证据。",
            is_pinned=False,
        )

        paper3 = ArxivPaper(
            arxiv_id="2510.20672",
            title="An Axial-Vector Leptophilic Fifth Force Sourced by Solar Neutrinos",
            authors=json.dumps(["Rundong Fang", "Ji-Heng Guo", "Jia Liu", "Xiao-Ping Wang", "YanLi Zhao"], ensure_ascii=False),
            abstract="We investigate an axial-vector leptophilic fifth force sourced by solar neutrinos and its phenomenological constraints, with precision observables providing complementary tests under the model assumptions.",
            journal="Phys.Rev.D 113 (2026) 055041",
            source_url="https://arxiv.org/abs/2510.20672",
            primary_category="hep-ph",
            published_date="2025-10-23",
            pdf_url="https://arxiv.org/pdf/2510.20672.pdf",
            recommended_by_id=prof_li.id,
            recommend_comment="重点核对太阳中微子源的处理、相互作用结构、实验可观测量及约束所依赖的假设。",
            is_pinned=False,
        )

        paper4 = ArxivPaper(
            arxiv_id="2506.10673",
            title="Ultimate Quantum Precision Limit at Colliders: Conditions and Case Studies",
            authors=json.dumps(["Tengyu Ai", "Qi Bi", "Yuxin He", "Jia Liu", "Xiao-Ping Wang"], ensure_ascii=False),
            abstract="We examine the conditions for collider measurements to approach quantum precision limits and discuss representative case studies, distinguishing information-theoretic bounds from practical experimental precision.",
            journal="Phys.Rev.Lett. 135 (2025) 241804",
            source_url="https://arxiv.org/abs/2506.10673",
            primary_category="hep-ph",
            published_date="2025-06-12",
            pdf_url="https://arxiv.org/pdf/2506.10673.pdf",
            recommended_by_id=prof_wang.id,
            recommend_comment="讨论量子信息界、可观测量构造和实验统计精度之间的关系，注意结论适用的测量与模型条件。",
            is_pinned=False,
        )

        paper5 = ArxivPaper(
            arxiv_id="2409.17243",
            title="Long-lived Sterile Neutrino Searches at Future Muon Colliders",
            authors=json.dumps(["Qi Bi", "Jinhui Guo", "Jia Liu", "Yan Luo", "Xiao-Ping Wang"], ensure_ascii=False),
            abstract="We study future muon-collider sensitivity to long-lived sterile neutrinos and displaced signatures, with reach depending on sterile-neutrino masses, active-sterile mixing, lifetimes, and detector assumptions.",
            journal="Phys.Rev.D 111 (2025) 075001",
            source_url="https://arxiv.org/abs/2409.17243",
            primary_category="hep-ph",
            published_date="2024-09-25",
            pdf_url="https://arxiv.org/pdf/2409.17243.pdf",
            recommended_by_id=student1.id,
            recommend_comment="阅读时记录质量—混合参数化、寿命与探测器接受度；不要把某一基准点的灵敏度当作普适排除结论。",
            is_pinned=False,
        )

        paper6 = ArxivPaper(
            arxiv_id="2603.17237",
            title="Ultralight Scalar Dark Matter with Off-Diagonal Flavor Couplings",
            authors=json.dumps(["Jinhui Guo", "Jia Liu", "Chenhao Peng", "Xiao-Ping Wang", "Hang Zhao"], ensure_ascii=False),
            abstract="We investigate ultralight scalar dark matter with off-diagonal flavor couplings and discuss complementary probes from time-dependent measurements and flavor observables.",
            journal="Phys.Rev.D 114 (2026) 015022",
            source_url="https://arxiv.org/abs/2603.17237",
            primary_category="hep-ph",
            published_date="2026-03-18",
            pdf_url="https://arxiv.org/pdf/2603.17237.pdf",
            recommended_by_id=prof_wang.id,
            recommend_comment="关注相干暗物质背景、味非对角耦合和时域/味物理观测之间的互补性，并明确模型参数依赖。",
            is_pinned=False,
        )

        paper7 = ArxivPaper(
            arxiv_id="2610.04971",
            title="Probing anomalous Wtb couplings through bW spin correlations in top-quark pair production at the HL-LHC",
            authors=json.dumps(["Qi Bi", "Zekun Li", "Chuntao Liu", "Jia Liu", "Xiao-Ping Wang"], ensure_ascii=False),
            abstract="We study how b-quark and W-boson spin correlations in top-quark pair production can probe anomalous Wtb couplings and estimate the statistical sensitivity at the HL-LHC.",
            source_url="https://arxiv.org/abs/2610.04971",
            primary_category="hep-ph",
            published_date="2026-10-04",
            pdf_url="https://arxiv.org/pdf/2610.04971.pdf",
            recommended_by_id=prof_shu.id,
            recommend_comment="重点检查自旋关联可观测量、异常耦合参数化、统计假设和 HL-LHC 灵敏度的适用条件。",
            is_pinned=False,
        )

        db.add_all([paper1, paper2, paper3, paper4, paper5, paper6, paper7])
        db.commit()

        # 3. 组会排期：主题、文献和演示状态保持一一对应；时间按 2026-10-21 校准。
        seminar1 = SeminarSchedule(
            date="2026-10-23",
            time="14:30",
            location="演示排期，地点待确认",
            presenter_name="张明 (博士生)",
            presenter_id=student1.id,
            topic="纯非弹性标量暗物质：热共湮灭、相变与长寿命粒子信号",
            paper_id=paper1.id,
            slides_url=None,
            notes="阅读 arXiv:2508.13276，梳理暗物质质量分裂、热共湮灭、一阶相变和长寿命粒子搜索；区分 benchmark 与完整参数空间。",
            status="upcoming",
        )
        seminar2 = SeminarSchedule(
            date="2026-10-30",
            time="14:30",
            location="演示排期，地点待确认",
            presenter_name="青年教师",
            presenter_id=prof_li.id,
            topic="标量介导惰性中微子：相变引力波与位移顶点",
            paper_id=paper2.id,
            slides_url=None,
            notes="阅读 arXiv:2509.23925，关注 Higgs–标量混合、惰性中微子寿命、相变完成条件和位移顶点接受度。",
            status="upcoming",
        )
        seminar3 = SeminarSchedule(
            date="2026-11-06",
            time="14:30",
            location="演示排期，地点待确认",
            presenter_name="合作导师",
            presenter_id=prof_wang.id,
            topic="太阳中微子源的轴矢量轻子第五力",
            paper_id=paper3.id,
            slides_url=None,
            notes="阅读 arXiv:2510.20672，核对太阳中微子源、相互作用结构、实验可观测量与约束假设。",
            status="upcoming",
        )
        seminar4 = SeminarSchedule(
            date="2026-10-16",
            time="14:30",
            location="演示排期，地点待确认",
            presenter_name="张明 (博士生)",
            presenter_id=student1.id,
            topic="对撞机量子精度极限：可达条件与案例分析",
            paper_id=paper4.id,
            slides_url=None,
            notes="阅读 arXiv:2506.10673，区分量子信息界、统计误差与具体实验可达精度。",
            status="completed",
        )
        seminar5 = SeminarSchedule(
            date="2026-10-09",
            time="14:30",
            location="演示排期，地点待确认",
            presenter_name="青年教师",
            presenter_id=prof_li.id,
            topic="未来 μ 子对撞机中的长寿命惰性中微子搜索",
            paper_id=paper5.id,
            slides_url=None,
            notes="阅读 arXiv:2409.17243，明确质量、混合、寿命和探测器接受度的依赖。",
            status="completed",
        )
        db.add_all([seminar1, seminar2, seminar3, seminar4, seminar5])
        # 4. 高能粒子物理教材与权威综述
        books = [
            ResourceBook(
                title="现代粒子物理 (Modern Particle Physics)",
                original_title="Modern Particle Physics",
                authors="Mark Thomson",
                category="基础理论与专著",
                description="面向高年级本科生与研究生的粒子物理教材，涵盖衰变与截面、标准模型、希格斯、QCD、中微子和标准模型之外的新物理。",
                cover_url="",
                tutorial_url="https://www.cambridge.org/cc/titles/modern-particle-physics",
                exercise_url="",
                github_url="",
                download_url=None,
                order_num=1,
            ),
            ResourceBook(
                title="量子场论与标准模型 (Quantum Field Theory and the Standard Model)",
                original_title="Quantum Field Theory and the Standard Model",
                authors="Matthew D. Schwartz",
                category="基础理论与专著",
                description="研究生层次的量子场论教材，系统讨论散射与衰变、费曼规则、重整化、规范理论、标准模型、有效场论和重整化群。",
                cover_url="",
                tutorial_url="https://www.cambridge.org/highereducation/books/quantum-field-theory-and-the-standard-model/A4CD66B998F2C696DCC75B984A7D5799",
                exercise_url="",
                github_url="",
                download_url=None,
                order_num=2,
            ),
            ResourceBook(
                title="粒子物理评论 (Review of Particle Physics, 2026)",
                original_title="Review of Particle Physics (2026)",
                authors="Particle Data Group",
                category="实验数据与综述",
                description="粒子性质、标准模型综述、实验方法和新粒子搜索的权威入口。引用数值或限制时必须记录具体版本、条目和勘误；旧版数据不自动代表当前限制。",
                cover_url="",
                tutorial_url="https://pdg.lbl.gov/2026/",
                exercise_url="",
                github_url="",
                download_url=None,
                order_num=3,
            )
        ]
        db.add_all(books)
        db.commit()
        print("课题组初始演示数据成功写入！")
    finally:
        from .services.library_service import backfill
        backfill(db)
        _seed_default_invite_codes(db)


def init_db():
    from .migrations import migrate
    migrate(engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 如果已经存在用户，只补充种子邀请码后返回
        if db.query(User).first():
            _seed_default_invite_codes(db)
            return

        # 仅当显式声明 SEED_DEMO_DATA=1 时才灌入测试模拟数据（用于无服务静态或纯测试环境）
        if os.getenv("SEED_DEMO_DATA", "").lower() in ("1", "true", "yes"):
            _seed_demo_data(db)
            return

        # 默认真实服务器部署：保持数据库干净（零用户、零排期、未初始化状态）
        # 等待首个管理员在浏览器通过 /setup 首次部署向导完成配置
        print("==================================================")
        print("✨ LabOrbit 数据库表结构初始化就绪（纯净生产部署模式）")
        print("💡 当前无任何管理员账号，请在浏览器中打开平台访问 /setup 进行首次部署向导配置！")
        print("==================================================")
    finally:
        db.close()



if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Lab-Hub 数据库初始化工具")
    parser.add_argument("--clean", action="store_true", help="初始化干净的生产数据库（仅创建管理员与教材资料，无模拟用户与排期）")
    parser.add_argument("--reset", action="store_true", help="重置已有表结构后再进行初始化")
    args = parser.parse_args()

    if args.clean:
        init_clean_db(reset=args.reset)
    else:
        init_db()
