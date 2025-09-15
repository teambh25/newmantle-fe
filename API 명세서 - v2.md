# API 명세서 - v2

> FastAPI 마이그레이션 하면서 뜯어 고침, `{server_url}/docs`로 swagger 확인 가능
> 

## Game

**유사도 계산**

- 사용법
    - http get 메소드 `{server_url}/quizzes/{date}/guess/{word}`
    - date(string, date) : YYYY-MM-DD (**주의! 7월이면 07로 입력**)
    - word(string) : 유사도를 계산할 단어(유저가 입력한 단어)
- 응답 (json 형태)
    - 옳바르지 않은 날짜(ex. 2024-13-01)는 422 에러 반환
    - 등록이 되어있지 않은 날짜는 400에러 반환
    - 등록 되어있지 않은 단어는 http 400 에러 반환
    - correct(bool) : 정답 여부
    - rank(int) : 순위(1~999까지), 정답은 NULL, 그 외는 -1
    - score(float) : 유사도 점수 (0~100, 소수점 2자리까지), 정답 시 NULL
    - 예시
        
        ```json
        # 정답 #
        {
          "correct": True,
          "rank": None,
          "score": None
        }
        
        # 순위권 단어 #
        {
          "correct": False,
          "rank": 3,
          "score": 85.34
        }
        
        # 순위권 밖 단어 #
        {
          "correct": False,
          "rank": -1,
          "score": 12.34
        }
        
        ```
        

**힌트 API**

- 사용법
    - http get 메소드 `{server_url}/quizzes/{date}/hint/{rank}`
    - date(string) : YYYY-MM-DD
    - rank(int) : 힌트 번호 (1~999는 단어 전체 제공, 0은 정답 단어 초성 힌트)
- 응답
    - 잘못된 날짜, 힌트 번호는 422에러
    - 존재하지않는 날짜는 400에러
    - hint(string) : 초성 or 단어가 유니코드로 반환됨  ****
    - score(float) : 유사도 점수(0~100사이), 정답(num=0)일 경우엔 null
    - 예시
        
        ```json
        # 정답 (rank=0)
        {
        	"word":"\u3142\u314a\u3131", // ㅂㅊㄱ
        	"score" : null 
        }
        
        # 그 외 (rank=1~999)
        {
        	"word":"\ubd80\uce68\uac1c", // 부침개
        	"score" : 76.25,
        }
        ```
        

---

## Admin

- 모든 요청에 admin id/pw 입력 필요 (id=eok, pw=6636)

**퀴즈 등록/수정 API** 

- 사용법
    - put 메소드 : `admin/quizzes`
    - 파라미터로 날짜(YYYY-MM-DD), 정답 단어, 유사도(단어-유사도) json 입력
- 응답
    - 성공 시 {날자:정답 단어} 반환됨

**퀴즈 삭제 API**

- 사용법
    - Delete 메소드 : `admin/quizzes/{date}`
- 응답
    - 성공 시 200 코드 반환 (메세지는 따로 X)

**등록된 퀴즈 확인 API**

- 사용법
    - get 메소드 :`admin/quizzes/answers`
- 응답
    - 등록된 모든 퀴즈(날짜-단어)가 반환됨