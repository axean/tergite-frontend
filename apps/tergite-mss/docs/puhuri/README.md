# NQ IAA Stack code

A place to share code relating to the development of the IAA stack for NordIQuEst.

## The Swedish Quantum Computer Playground

Find the playground in [logic jupyter notebook](logic.ipynb)

### How to run playground

- Create and activate conda environment

```shell
conda create -n plg python=3.12
conda activate plg
```

- Clone this repo and install dependencies

```shell
git clone git@github.com:tergite/tergite-frontend.git
cd tergite-frontend/apps/tergite-mss/docs/puhuri
pip install -r requirements.txt
```

- Copy the [logic jupyter notebook](logic.ipynb) to a `.local.ipynb` one to allow you enter your secret variables.
  _(`.local.ipynb` notebooks are ignored by git)_

```shell
cp logic.ipynb notebooks/logic.local.ipynb
```

- Open the [logic.local jupyter notebook](logic.local.ipynb) in [visual studio code](https://code.visualstudio.com/download)

- Select the conda environment (`plg`) you created before in the notebook (top right of the notebook)
- Update the variables in that notebook like `WALDUR_TOKEN`, `WALDUR_TOKEN` and `PROJECT_UUID` (and any others) with the right values.
- Run the code cells in the notebook
