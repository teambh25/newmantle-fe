# API 명세서 - v1

## 유사도 계산 API

- http get 메소드 `/guess/string:day/string:word`
    - day(string) : YYYY-MM-DD (**주의! 7월이면 07로 입력**)
    cf. 현재는 3으로 입력해도 가능한 상태
    - word(string) : 유사도를 계산할 단어(유저가 입력한 단어) (cf. 정답 단어는 서버에 존재함)
- json 반환
    - 계산 불가능한 단어와 날짜는 http 400 에러 반환
    - correct(bool) : 정답 여부
    - rank(int) : 순위(1~999까지, -1은 범위 벗어남), 정답 시 NULL
    - score(float) : 유사도 점수 (0~100까지), 정답 시 NULL
    - 예시
        
        ```json
        {
          "correct": false,
          "rank": 1,
          "score": 0.8336
        }
        ```
        

---

## 힌트 API

- 설명
    - 원하는 날짜의 순위 입력 시 해당 단어와 초성을 반환
- 사용법
    - http get 메소드 `/hint/string:day/int:num`
    - day(string) : YYYY-MM-DD (**주의! 7월이면 07로 입력**)
    - num(int) : 순위 (0~999까지, 0은 정답)
- 결과
    - json 반환
    - word(string) : 해당 순위의 단어 **(주의! 유니코드로 반환됨)**
    - consonants(string) : 단어의 초성 반환 **(주의! 유니코드로 반환됨)**
    - score(float) : 유사도 점수
    - 예시
        
        ```json
        {
        	"consonants":"\u3142\u314a\u3131", // ㅂㅊㄱ
        	"word":"\ubd80\uce68\uac1c", // 부침개
        	"score" : 76.25,
        }
        ```
        

---

## 순위 공개 API

- [ ]  html 전송은 네트워크 비용 이슈 존재, Json은 괜찮나?
- 설명
    - 원하는 날짜의 정답과 유사도 상위 999개 단어를 유사도와 함께 반환
- 사용법
    - http get 메소드 : `/result/string:day`
    - day(string) : YYYY-MM-DD (**주의! 7월이면 07로 입력**)
- 결과
    - json 반환 (`주의! 단어는 유니코드로 반환됨`)
    - answer(string) :  정답 단어
    - words(List[string]) : 유사도 top 999개 단어, 유사도로 내림차순 정렬됨
    - scores(List[float]) : 유사도 top 999개의 유사도, 내림차순 정렬됨
    - 예시
        
        ```json
        {
        	"anwer": "\ud30c\uc804",
          "scores": [
            89.63,
            89.13,
            88.83,
            87.8,
            ...
            ],
            "words": [
            "\ube48\ub300\ub5a1",
            "\ub3d9\ub3d9\uc8fc",
            "\ubd80\uce68\uac1c",
            "\uaf2c\uce58\uad6c\uc774",
            ...
            ]
        }
        ```
        

---

## 정답 단어 CRUD

- `curl -X GET {endpoint}/answer`
    - 메모리에 존재하는 정답 단어 모두 반환 (날짜-정답 구조의 json)
    - 반환 예시
        
        ```bash
        {
          "2024-07-18": "\ud30c\uc804",
          "2024-07-19": "\uc18c\ud3ec",
          "2024-07-20": "\ud608\ub2f9",
          "2024-07-21": "\u00eb\u00b0\u00a5"
        }
        ```
        
- `curl -X GET {endpoint}/answer/{YYYY-MM-DD}`
    - 특정 날짜의 정답 단어를 string으로 반환
    - 잘못된 날짜의 경우 400 에러
- `curl -X PUT {endpoint}/answer/{YYYY-MM-DD}/{URL encoded word}`
    - 해당 날짜의 정답을 설정 (이미 설정된 날짜의 경우 업데이트 됨)
    - 사전에 없는 단어의 경우 400 에러
    - 성공 시 해당 날짜와 설정된 정답을 string으로 반환
    - cf. 단어 URL 인코딩 [https://www.urlencoder.org/ko/](https://www.urlencoder.org/ko/)
- `curl -X Delelte {endpoint}/answer/{YYYY-MM-DD}`
    - 특정 날짜의 정답을 삭제
    - 성공 시 삭제된 날짜를 반환
- `curl {endpoint}/append/{URL encoded word}`
    - 가장 과거의 단어를 삭제하고, 가장 나중에 설정된 정답 날짜 + 1의 정답 단어를 설정함
    - 성공 시 설정된 날짜와 정답 단어를 string으로 반환