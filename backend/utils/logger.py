import logging
import sys


def configure_logging(level: int = logging.INFO) -> None:
    root = logging.getLogger()
    if root.handlers:
        return  # already configured (uvicorn / pytest)
    handler = logging.StreamHandler(sys.stdout)
    fmt = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    handler.setFormatter(logging.Formatter(fmt, datefmt="%H:%M:%S"))
    root.addHandler(handler)
    root.setLevel(level)

    # Quiet noisy libs
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error", "motor"):
        logging.getLogger(name).setLevel(logging.WARNING)
