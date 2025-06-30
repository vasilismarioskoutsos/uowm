Movie Recommendation System using LightGCN and FIRE

The repository contains 4 main folders:
1. dataset: contains the data downloaded from the MovieLens 100k public dataset and some preprocessed data.
2. fire: contains the FIRE implementation.
3. model: contains the LightGCN implementation.
4. pipeline: this is the folder that contains the recommendation pipeline, from the collaboration of LightGCN and FIRE to the Flask app.
5. backend: contains the PHP files.
6. mymovies: contains the react Web app.

To run the project:
1. Install python 3.12.9
2. Install npm 9.7.2
3. Install php 8.4.8
4. Install node.js 18.15.0
5. Create and activate a virtual environment  
python3 -m venv venv
source venv/bin/activate  macOS/Linux
venv\Scripts\activate Windows
6.Install required libraries 
pip install -r requirements.txt
Check package.json for the libraries that the react app needs to work.
7. Finally, to start both the web app and the servers run:
npm run dev
