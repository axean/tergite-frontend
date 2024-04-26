# Backends

This is documentation about how we manage the different backends that connect to MSS

## How to Add New BCC

- Start your [tergite-bcc](https://github.com/tergite/tergite-bcc) instance
- Copy the `mss-config.example.toml` to `mss-config.toml`.  
  Note: You could also create a new toml file based on `mss-config.example.toml`  
  and set the `MSS_CONFIG_FILE` environment variable to point to that file.
- Add the new client:

```toml
[[backends]]
# this name of the backend computer that will be accessible from tergite.qiskit and from webGUI
name = "simulator-arusha"
# the URL where this backend is running
url = "http://127.0.0.1:8002"
```

```shell
cp bcc_mss-config.example.toml bcc_mss-config.toml
```

- Update the values in the `bcc_mss-config.toml` file. It should have comments describing what each value signifies.

- Start your MSS

```shell
./start_mss
```

## TODO

- [x] Replace `.env` file with `mss-config.toml`
- [x] Update the `start_mss.sh` script to read env variables from the path pointed to by `MSS_CONFIG_FILE`
- [x] Update `auth_mss-config.toml` to be read from `mss-config.toml` in MSS
- [x] Update MSS tests to use the `mss-config.toml` file
- [ ] Update `auth_mss-config.toml` to be read from `mss-config.toml` in webgui
- [ ] Update `auth_mss-config.toml` to be read from `mss-config.toml` in landing page
- [ ] Add `mss-config.toml` in test server
- [ ] Update CHANGELOG to show a breaking change
