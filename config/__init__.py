import pathlib
import tomli

path = pathlib.Path(__file__).parent / "app_config.toml"
with path.open(mode="rb") as fp:
    app_config = tomli.load(fp)
