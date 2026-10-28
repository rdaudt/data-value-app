# Data Value Explorer MVP — Rapid UX Build 
 
## Setup 
``` 
python -m venv venv 
.\venv\Scripts\Activate.ps1 
pip install -r generator\requirements.txt 
``` 
 
## Generate data 
``` 
python generator\generate.py --seed 42 --out data 
xcopy /E /Y data explorer\public\data\ 
``` 
 
## Run explorer 
``` 
cd explorer && npm run dev 
``` 
 
## Offline demo build 
``` 
cd explorer && npm run build && npx vite preview 
``` 