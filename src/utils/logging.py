"""Logging configuration and utilities."""

import logging
import sys
from typing import Optional


_loggers = {}


def setup_logger(name: str = "pbr_generator", debug: bool = False) -> logging.Logger:
    """Setup and configure logger.
    
    Args:
        name: Logger name.
        debug: Enable debug logging.
        
    Returns:
        Configured logger instance.
    """
    logger = logging.getLogger(name)
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Set level
    level = logging.DEBUG if debug else logging.INFO
    logger.setLevel(level)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    
    # Add handler
    logger.addHandler(console_handler)
    
    # Store logger
    _loggers[name] = logger
    
    return logger


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Get logger instance.
    
    Args:
        name: Logger name. If None, returns root logger.
        
    Returns:
        Logger instance.
    """
    if name is None:
        name = "pbr_generator"
    
    if name not in _loggers:
        return setup_logger(name)
    
    return _loggers[name]