from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 从环境变量读取，避免在代码中硬编码敏感/用户相关配置
    ark_api_key: str
    ark_model_id: str
    ark_base_url: str

    # 其他非敏感配置可以保留默认值
    database_url: str = "sqlite:///./content_detect.db"
    upload_dir: str = "uploads"
    faiss_data_dir: str = "faiss_data"
    embedding_model: str = "paraphrase-multilingual-MiniLM-L12-v2"

    # 是否禁用 FAISS，由环境变量 DISABLE_FAISS 控制
    disable_faiss: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
