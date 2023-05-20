import { Client, validateSignature, exceptions } from '@line/bot-sdk';
import fetch from "node-fetch";
const handler = async (event: any) => {
  // 取得環境變數
  console.log(event); // 添加此行日志输出
  const clientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.CHANNEL_SECRET || '',
  };
  // 用 CHANNEL_ACCESS_TOKEN 和 CHANNEL_SECRET 初始化 Line Bot
  const client = new Client(clientConfig);

  // 為 Webhook 驗證做準備
  const signature = event.headers['x-line-signature'];
  const body = event.body;
  const WEAKey=process.env.WEA_TOKEN;
  // Line Bot 運作邏輯
  const handleEvent = async (event: any) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return Promise.resolve(null);
    }
    const { replyToken } = event;
    const { text } = event.message;
    
    console.log('Fetching weather data...');
    //取得輸入位置的座標
    await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${text}&appid=${WEAKey}`)
      .then((response) => response.json())
      .then((data) => {
        //避免沒找到地方出現錯誤
        if (data.length === 0) {
          throw new Error('Empty data');
        }
        const lat = data[0].lat;
        const lon = data[0].lon;
        //取得空汙和天氣資訊
        return Promise.all([
          fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEAKey}&units=Metric&lang=zh_tw`),
          fetch(`http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEAKey}`)
        ]);
      })
      .then(([weatherResponse, airpollutionResponse]) => {
        return Promise.all([weatherResponse.json(), airpollutionResponse.json()]);
      })
      .then(async ([weatherData, airpollutionData]) => {
        console.log('Received weather data:', weatherData);
        console.log('Received air pollution data:', airpollutionData);
        // Create a new message
        const aqi = airpollutionData.list[0].main.aqi;
        const aqiMapping = {
          1: '很好',
          2: '尚可',
          3: '普通',
          4: '稍差',
          5: '最差'
        };
        const messageResponse  ={
        "type": "flex",
        "altText": "carousel flex",
        "contents": {
            "type": "carousel",
            "contents": [
          { 
            "type": "bubble",
            "hero": {
              "type": "image",
              "url": `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`,
              "size": "full",
              "aspectRatio": "20:13",
              "aspectMode": "cover"
            },
            "body": {
              "type": "box",
              "layout": "vertical",
              "contents": [
                {
                  "type": "text",
                  "text": "今日天氣",
                  "weight": "bold",
                  "size": "xl"
                },
                {
                  "type": "box",
                  "layout": "vertical",
                  "margin": "lg",
                  "spacing": "sm",
                  "contents": [
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "縣市名稱:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.name}\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "溫度:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.main.temp}度\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "體感溫度:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.main.feels_like}度\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "最低溫:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.main.temp_min}度\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "最高溫:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.main.temp_max}度\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "濕度:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.main.humidity}%\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "風速:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.wind.speed}m/s\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "陣風:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.wind.gust}m/s\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "天氣狀況:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${weatherData.weather[0].description}\n`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    },
                    {
                      "type": "box",
                      "layout": "baseline",
                      "spacing": "sm",
                      "contents": [
                        {
                          "type": "text",
                          "text": "空氣品質:",
                          "color": "#000000",
                          "size": "md",
                          "flex": 2
                        },
                        {
                          "type": "text",
                          "text": `${aqiMapping[aqi]}`,
                          "wrap": true,
                          "color": "#666666",
                          "size": "md",
                          "flex": 5
                        }
                      ]
                    }
                    
                  ]
                }
              ]
            }
          }
        ]}};
        await client.replyMessage(replyToken,messageResponse);
        console.log('Reply message sent successfully.');
      })
      .catch((error) => {
        console.log('An error occurred:', error);
        const errorMessage = {
          type: 'text',
          text: '找不到這地方(中文的話請記得加入縣市鄉鎮)'
        };
        await client.replyMessage(replyToken, errorMessage);
      });
  };

  try {
    // 用 CHANNEL_SECRET 來驗證 Line Bot 身分
    if (!validateSignature(body, clientConfig.channelSecret, signature)) {
      throw new exceptions.SignatureValidationFailed('signature validation failed', signature);
    }

    // 將 JSON 轉為 JavaScript 物件
    const objBody = JSON.parse(body);
    // 將觸發事件交給 Line Bot 做處理
    await Promise.all(objBody.events.map(handleEvent));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Hello from Netlify' }),
    };
  } catch (error) {
    console.log(error);
    console.log(event.body);
    return { statusCode: 500, body: error.toString() };
  }
};

export { handler };