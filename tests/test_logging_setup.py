"""`graphite.logging_setup`: the one dictConfig entry point (spec 02 sec. 8)."""

from __future__ import annotations

import logging

from graphite.logging_setup import _LevelPrefixFormatter, configure, get_logger


# frob:tests graphite/logging_setup.py::_LevelPrefixFormatter.format
def test_level_prefix_formatter_plain_below_warning():
    fmt = _LevelPrefixFormatter()
    record = logging.LogRecord(
        name="x", level=logging.INFO, pathname="", lineno=0,
        msg="hello", args=(), exc_info=None,
    )
    assert fmt.format(record) == "hello"


# frob:tests graphite/logging_setup.py::_LevelPrefixFormatter.format
def test_level_prefix_formatter_prefixes_warning_and_above():
    fmt = _LevelPrefixFormatter()
    record = logging.LogRecord(
        name="x", level=logging.WARNING, pathname="", lineno=0,
        msg="uh oh", args=(), exc_info=None,
    )
    assert fmt.format(record) == "WARNING: uh oh"


# frob:tests graphite/logging_setup.py::configure
def test_configure_is_idempotent():
    configure()
    root_before = logging.getLogger().handlers
    configure()
    assert logging.getLogger().handlers is root_before


# frob:tests graphite/logging_setup.py::get_logger
def test_get_logger_returns_named_logger_and_configures():
    logger = get_logger("graphite.some.module")
    assert isinstance(logger, logging.Logger)
    assert logger.name == "graphite.some.module"
