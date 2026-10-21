from backend.database import SessionLocal
from backend.models import ArxivPaper, ResourceBook, SeminarSchedule


EXPECTED_PAPERS = {
    "2508.13276": "Probing Purely Inelastic Scalar Dark Matter Across Colliders and Gravitational Wave Observatories",
    "2509.23925": "Probing Scalar-Mediated Sterile Neutrinos with Gravitational Wave and Colliders Signals",
    "2510.20672": "An Axial-Vector Leptophilic Fifth Force Sourced by Solar Neutrinos",
    "2506.10673": "Ultimate Quantum Precision Limit at Colliders: Conditions and Case Studies",
    "2409.17243": "Long-lived Sterile Neutrino Searches at Future Muon Colliders",
    "2603.17237": "Ultralight Scalar Dark Matter with Off-Diagonal Flavor Couplings",
    "2610.04971": "Probing anomalous Wtb couplings through bW spin correlations in top-quark pair production at the HL-LHC",
}


def test_demo_seed_uses_real_hep_phenomenology_records_and_sources():
    with SessionLocal() as db:
        papers = {
            paper.arxiv_id: paper
            for paper in db.query(ArxivPaper).filter(
                ArxivPaper.arxiv_id.in_(EXPECTED_PAPERS.keys())
            ).all()
        }
        assert set(papers) == set(EXPECTED_PAPERS)
        for arxiv_id, title in EXPECTED_PAPERS.items():
            paper = papers[arxiv_id]
            assert paper.title == title
            assert paper.source_url == f"https://arxiv.org/abs/{arxiv_id}"
            assert paper.pdf_url == f"https://arxiv.org/pdf/{arxiv_id}.pdf"
            assert paper.primary_category == "hep-ph"
            assert paper.abstract.startswith("演示用中文导读（非原文逐字摘要）：")
        assert db.query(ArxivPaper).filter(
            ArxivPaper.arxiv_id.in_(["2301.07094", "2402.08654"])
        ).count() == 0


def test_demo_seminars_link_to_the_matching_phenomenology_papers():
    expected = {
        "2508.13276": ("2026-10-23", "纯非弹性标量暗物质"),
        "2509.23925": ("2026-10-30", "标量介导惰性中微子"),
        "2510.20672": ("2026-11-06", "太阳中微子源的轴矢量轻子第五力"),
        "2506.10673": ("2026-10-16", "对撞机量子精度极限"),
        "2409.17243": ("2026-10-09", "未来 μ 子对撞机"),
    }
    expected_topics = [topic for _, topic in expected.values()]
    with SessionLocal() as db:
        papers = {
            paper.arxiv_id: paper
            for paper in db.query(ArxivPaper).filter(
                ArxivPaper.arxiv_id.in_(expected.keys())
            ).all()
        }
        seminars = db.query(SeminarSchedule).filter(
            SeminarSchedule.topic.in_(expected_topics)
        ).all()
        papers_by_pk = {paper.id: paper for paper in papers.values()}
        linked = {papers_by_pk[seminar.paper_id].arxiv_id: seminar for seminar in seminars}
        assert set(linked) == set(expected)
        for arxiv_id, (date, topic_prefix) in expected.items():
            assert linked[arxiv_id].date == date
            assert linked[arxiv_id].topic.startswith(topic_prefix)


def test_demo_resources_focus_on_particle_physics_and_reproducible_phenomenology():
    expected_titles = {
        "Modern Particle Physics",
        "Quantum Field Theory and the Standard Model",
        "粒子物理评论 (Review of Particle Physics, 2026)",
    }
    with SessionLocal() as db:
        titles = {book.title for book in db.query(ResourceBook).all()}
    assert expected_titles.issubset(titles)
