"""Application settings loaded from environment / .env files."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """ACE backend configuration."""

    # ========== Core mode ==========
    ACE_MODE: str = "demo"  # "demo" or "live"

    # ========== Chain & payment ==========
    ARC_RPC_URL: str = "https://rpc.testnet.arc.network"
    ARC_CHAIN_ID: int = 5042002
    USDC_DECIMALS: int = 6

    # Circle x402 Gateway configuration
    CIRCLE_FACILITATOR_URL: str = "https://gateway-api-testnet.circle.com"
    X402_SETTLEMENT_MODE: str = "demo"  # "demo" or "facilitator"
    GATEWAY_WALLET_CONTRACT: str = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"
    USDC_CONTRACT: str = "0x000000000000000000000000000000000000ACE2"
    SELLER_ADDRESS: str = "0x000000000000000000000000000000000000ACE3"

    # ========== Wallet keys (live mode only) ==========
    PRODUCER_PRIVATE_KEY: str | None = None
    CONSUMER_PRIVATE_KEY: str | None = None
    AUDITOR_PRIVATE_KEY: str | None = None  # used to sign capability attestations

    # ========== Database ==========
    DATABASE_URL: str = "sqlite:///./data/ace.db"

    # ========== LLM configuration ==========
    LLM_API_KEY: str | None = None
    LLM_BASE_URL: str = "https://api.deepseek.com/v1"
    LLM_MODEL: str = "deepseek-v4-flash"

    # ========== Economic parameters for ROI calculus ==========
    ESTIMATED_DIRECT_INPUT_KT: int = 120
    ESTIMATED_DIRECT_OUTPUT_KT: int = 30
    PRICE_INPUT_PER_MT: float = 0.14
    PRICE_OUTPUT_PER_MT: float = 0.28

    @property
    def is_demo_mode(self) -> bool:
        return self.ACE_MODE.lower() == "demo"

    @property
    def is_live_mode(self) -> bool:
        return self.ACE_MODE.lower() == "live"

    @property
    def use_facilitator_settlement(self) -> bool:
        return self.X402_SETTLEMENT_MODE.lower() == "facilitator"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
