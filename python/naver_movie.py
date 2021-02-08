from pymongo import MongoClient
from pymongo.cursor import CursorType
from bs4 import BeautifulSoup
from urllib.request import urlopen
import mongo_crawling
from datetime import datetime
from dotenv import dotenv_values

config = dotenv_values(".env")
url = urlopen(config['NAVER_URL'])
bs = BeautifulSoup(url, 'html.parser')
body = bs.body

target = body.find(class_="lst_detail_t1")
list = target.find_all('li')
no = 0
# DB setting
client = MongoClient(config['MONGODB_URI'])
mongo = client
# flush DB
mongo.movieDB.movies.drop()
for n in range(0, len(list)):
    # print("=================================")
    no += 1
    # print("No.",no)
    # 영화 제목
    title = list[n].find(class_="tit").find("a").text
    # print("영화 제목 :\t", title)
    # 영화 포스터
    poster = list[n].select_one("div.thumb a img")
    poster_split = str(poster).split(" src")[1]
    poster_real = poster_split.replace("=",'').replace('"',"").replace(">",'')
    # print("포스터 URL : ", poster_real)
    # 영화 장르
    genre = list[n].find(class_="link_txt").find_all("a")
    genreList = [genre.text.strip() for genre in genre]
    # print("장르 : \t", genreList)
    # 개봉 일자
    date = list[n].find(class_ = 'info_txt1').find('dd').text
    dateList = [date.strip()]
    dateList2 = '20' + dateList[0][-11:-3]
    # print("개봉 일자 : \t", convert_date)
    # 네티즌 평점
    point = list[n].find(class_="num").text
    # print("네티즌 평점 : \t", point)
    # 감독
    try:
        director = list[n].find(class_="info_txt1").find_all("dd")[1].find("span").find_all("a")
        directorList = [director.text.strip() for director in director]
        # print("제작 감독 :\t", directorList)
    except IndexError:
        # print("제작 감독 :\t 정보 없음")
        directorList = "정보 없음"
    # 출연 배우
    try:
        cast = list[n].find(class_="lst_dsc").find("dl", class_="info_txt1").find_all("dd")[2].find(class_="link_txt").find_all("a")
        castList = [cast.text.strip() for cast in cast]
        # print("출연 배우 :\t", castList)
    except IndexError:
        # print("출연 배우 :\t 정보 없음")
        castList = "정보 없음"
    mongo_crawling.insert_item_one(mongo, {"no": no, "title": title, "imgURL" : poster_real, "genre" : genreList, "date" : dateList2, "point" : point, "director": directorList, "cast": castList}, "movieDB", "movies")

print("crawling is successfully done.")