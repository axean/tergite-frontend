# Backends

This is documentation about how we manage the different backends that connect to MSS

## How to Add New BCC

- Start your [tergite-bcc](https://github.com/tergite/tergite-bcc) instance
- Copy the `config.example.toml` to `config.toml`.  
  Note: You could also create a new toml file based on `config.example.toml`  
  and set the `CONFIG_FILE` environment variable to point to that file.
- Add the new client:

```toml
[[backends]]
# this name of the backend computer that will be accessible from tergite.qiskit and from webGUI
name = "simulator-arusha"
# the URL where this backend is running
url = "http://127.0.0.1:8002"
```

```shell
cp bcc_config.example.toml bcc_config.toml
```

- Update the values in the `bcc_config.toml` file. It should have comments describing what each value signifies.

- Start your MSS

```shell
./start_mss
```

## TODO

- [x] Replace `.env` file with `config.toml`
- [x] Update the `start_mss.sh` script to read env variables from the path pointed to by `CONFIG_FILE`
- [x] Update `auth_config.toml` to be read from `config.toml` in MSS
- [x] Update MSS tests to use the `config.toml` file
- [ ] Update `auth_config.toml` to be read from `config.toml` in webgui
- [ ] Update `auth_config.toml` to be read from `config.toml` in landing page
- [ ] Add `config.toml` in test server
- [ ] Update CHANGELOG to show a breaking change