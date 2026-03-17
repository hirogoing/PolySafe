"""初始化默认审核策略和规则数据"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, SessionLocal, Base
from app.models import Policy, Rule

Base.metadata.create_all(bind=engine)

SEED_POLICIES = [
    {
        "name": "色情内容审核策略",
        "description": "识别和拦截包含色情、低俗、裸露等不良内容",
        "rules": [
            {"name": "色情图片检测", "description": "检测图片中的色情、裸露、性暗示等内容", "violation_type": "色情", "action": "block", "priority": 10},
            {"name": "低俗文字过滤", "description": "过滤文本中的低俗、淫秽、挑逗性语言", "violation_type": "色情", "action": "block", "priority": 9},
            {"name": "擦边内容复核", "description": "对可能存在擦边球的暧昧内容进行人工复核", "violation_type": "色情", "action": "review", "priority": 5},
        ],
    },
    {
        "name": "暴力内容审核策略",
        "description": "识别和拦截包含暴力、血腥、伤害等内容",
        "rules": [
            {"name": "暴力血腥检测", "description": "检测图片视频中的打斗、流血、伤害等暴力场景", "violation_type": "暴力", "action": "block", "priority": 10},
            {"name": "恐怖惊悚检测", "description": "检测恐怖、惊悚、令人不适的视觉内容", "violation_type": "暴力", "action": "block", "priority": 8},
            {"name": "轻度冲突复核", "description": "对体育竞技、影视片段中的轻度冲突内容人工复核", "violation_type": "暴力", "action": "review", "priority": 3},
        ],
    },
    {
        "name": "仇恨与辱骂审核策略",
        "description": "识别仇恨言论、歧视内容与恶意辱骂",
        "rules": [
            {"name": "仇恨言论检测", "description": "检测针对群体的仇恨、歧视、贬损表达", "violation_type": "仇恨言论", "action": "block", "priority": 10},
            {"name": "恶意辱骂检测", "description": "检测持续辱骂、人身攻击、侮辱诽谤", "violation_type": "仇恨言论", "action": "review", "priority": 7},
        ],
    },
    {
        "name": "垃圾广告审核策略",
        "description": "识别和拦截垃圾广告、营销推广、站外引流",
        "rules": [
            {"name": "硬广引流检测", "description": "检测未经授权的商业广告、导流链接、联系方式轰炸", "violation_type": "垃圾广告", "action": "block", "priority": 7},
            {"name": "软广植入复核", "description": "对疑似软广、隐性推广内容进行人工复核", "violation_type": "垃圾广告", "action": "review", "priority": 4},
        ],
    },
    {
        "name": "违法交易审核策略",
        "description": "识别并拦截违法交易、诈骗、违规服务信息",
        "rules": [
            {"name": "诈骗诱导检测", "description": "检测刷单、投资诈骗、中奖诈骗等欺诈内容", "violation_type": "违法违规", "action": "block", "priority": 10},
            {"name": "违禁品交易检测", "description": "检测违禁品买卖、代办、灰黑产服务信息", "violation_type": "违法违规", "action": "block", "priority": 10},
            {"name": "灰区信息复核", "description": "对边界不清晰的交易信息进行人工复核", "violation_type": "违法违规", "action": "review", "priority": 5},
        ],
    },
    {
        "name": "个人隐私保护策略",
        "description": "保护用户个人隐私和敏感身份信息",
        "rules": [
            {"name": "身份证号泄露检测", "description": "检测身份证号、护照号等敏感身份信息外泄", "violation_type": "隐私泄露", "action": "block", "priority": 9},
            {"name": "联系方式批量泄露检测", "description": "检测手机号、住址、邮箱等批量泄露内容", "violation_type": "隐私泄露", "action": "block", "priority": 8},
            {"name": "一般隐私信息复核", "description": "对可能构成隐私侵害的内容人工复核", "violation_type": "隐私泄露", "action": "review", "priority": 5},
        ],
    },
    {
        "name": "未成年人保护策略",
        "description": "重点识别涉及未成年人的不当内容",
        "rules": [
            {"name": "未成年人不当内容检测", "description": "检测引导未成年人危险行为或不良价值导向内容", "violation_type": "未成年人保护", "action": "block", "priority": 10},
            {"name": "诱导打赏与消费检测", "description": "检测针对未成年人的诱导充值、打赏内容", "violation_type": "未成年人保护", "action": "block", "priority": 9},
            {"name": "教育类争议内容复核", "description": "对教育争议和场景复杂内容进行人工复核", "violation_type": "未成年人保护", "action": "review", "priority": 4},
        ],
    },
    {
        "name": "自伤自残风险策略",
        "description": "识别自伤、自残、自杀暗示及求助风险内容",
        "rules": [
            {"name": "明确自伤表达检测", "description": "检测明确的自伤计划、方法描述和鼓励言论", "violation_type": "自伤自残", "action": "block", "priority": 10},
            {"name": "高风险情绪求助检测", "description": "检测疑似高风险心理状态内容并进入复核", "violation_type": "自伤自残", "action": "review", "priority": 9},
            {"name": "关怀建议放行", "description": "纯心理援助与关怀建议可放行", "violation_type": "自伤自残", "action": "pass", "priority": 2},
        ],
    },
    {
        "name": "网络欺凌治理策略",
        "description": "治理群体围攻、长期骚扰、恶意曝光等行为",
        "rules": [
            {"name": "群体围攻检测", "description": "检测集体辱骂、起哄、恶意跟帖攻击", "violation_type": "网络欺凌", "action": "review", "priority": 8},
            {"name": "持续骚扰检测", "description": "检测重复骚扰、威胁、恐吓等行为", "violation_type": "网络欺凌", "action": "block", "priority": 9},
        ],
    },
    {
        "name": "版权与侵权内容策略",
        "description": "识别侵权搬运、盗版资源和未授权传播",
        "rules": [
            {"name": "盗版资源传播检测", "description": "检测网盘口令、破解资源、盗版影视/软件传播", "violation_type": "版权侵权", "action": "block", "priority": 9},
            {"name": "疑似搬运复核", "description": "对疑似未授权搬运内容进行人工复核", "violation_type": "版权侵权", "action": "review", "priority": 6},
        ],
    },
    {
        "name": "虚假宣传与夸大承诺策略",
        "description": "识别虚假承诺、绝对化宣传和误导性信息",
        "rules": [
            {"name": "绝对化用语检测", "description": "检测“包治百病”“稳赚不赔”等绝对承诺", "violation_type": "虚假宣传", "action": "review", "priority": 7},
            {"name": "高风险夸大宣传检测", "description": "检测可能造成财产或健康损失的误导宣传", "violation_type": "虚假宣传", "action": "block", "priority": 8},
        ],
    },
    {
        "name": "平台秩序与灌水策略",
        "description": "识别灌水刷屏、重复发布、低质量扰乱内容",
        "rules": [
            {"name": "重复灌水检测", "description": "检测高频重复文本、无意义刷屏内容", "violation_type": "平台秩序", "action": "review", "priority": 5},
            {"name": "恶意刷量检测", "description": "检测异常互动、异常发布行为文本线索", "violation_type": "平台秩序", "action": "block", "priority": 7},
        ],
    },
]


def seed():
    db = SessionLocal()
    existing = db.query(Policy).count()
    if existing > 0:
        print(f"数据库已有 {existing} 条策略，跳过种子数据初始化")
        db.close()
        return

    for p_data in SEED_POLICIES:
        policy = Policy(name=p_data["name"], description=p_data["description"])
        for r_data in p_data["rules"]:
            rule = Rule(**r_data)
            policy.rules.append(rule)
        db.add(policy)

    db.commit()
    print(f"成功初始化 {len(SEED_POLICIES)} 条审核策略")

    skip_faiss = os.getenv("SKIP_FAISS_REBUILD", "0") == "1"
    if skip_faiss:
        print("已跳过 FAISS 索引构建（SKIP_FAISS_REBUILD=1）")
    else:
        try:
            from app.services.faiss_service import faiss_service

            faiss_service.rebuild_from_db(db)
            print("FAISS索引构建完成")
        except Exception as e:
            print(f"FAISS索引构建失败（不影响策略入库）: {e}")

    db.close()


if __name__ == "__main__":
    seed()
