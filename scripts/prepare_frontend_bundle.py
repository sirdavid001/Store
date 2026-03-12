from pathlib import Path
import shutil


BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
FRONTEND_INDEX_FILE = FRONTEND_DIST_DIR / "index.html"
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / "assets"
TEMPLATE_FILE = BASE_DIR / "templates" / "react_storefront.html"
STATIC_ASSETS_DIR = BASE_DIR / "static" / "frontend-assets" / "assets"


def ensure_frontend_build_exists():
    if not FRONTEND_INDEX_FILE.exists():
        raise SystemExit("frontend/dist/index.html is missing. Run the frontend build first.")
    if not FRONTEND_ASSETS_DIR.exists():
        raise SystemExit("frontend/dist/assets is missing. Run the frontend build first.")


def copy_index_template():
    TEMPLATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    TEMPLATE_FILE.write_text(FRONTEND_INDEX_FILE.read_text(encoding="utf-8"), encoding="utf-8")


def copy_static_assets():
    STATIC_ASSETS_DIR.parent.mkdir(parents=True, exist_ok=True)
    if STATIC_ASSETS_DIR.exists():
        shutil.rmtree(STATIC_ASSETS_DIR)
    shutil.copytree(FRONTEND_ASSETS_DIR, STATIC_ASSETS_DIR)


def main():
    ensure_frontend_build_exists()
    copy_index_template()
    copy_static_assets()


if __name__ == "__main__":
    main()
