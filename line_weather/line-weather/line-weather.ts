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
    await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${text}&appid=${WEAKey}`)
      .then((response) => response.json())
      .then((data) => {
        console.log('Received geolocation data:', data);
        const lat = data[0].lat.toFixed(6);
        const lon = data[0].lon.toFixed(6);
        console.log(${lat});
        return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEAKey}&units=Metric`);
      })
      .then((response) => response.json())
      .then(async (data) => {
        console.log('Received weather data:', data);
        // Create a new message
        
        const messageResponse  = {
          type: 'text',
          text: `城市名稱:${data.name}\n溫度:${data.main.temp}\n體感溫度:${data.main.feels_like}\n最低溫:${data.main.temp_min}\n最高溫:${data.main.temp_max}\n濕度:${data.main.humidity}\n風速:${data.wind.speed}\n陣風:${data.wind.gust}\n天氣狀況: ${data.weather[0].description}\n`,
        };
        console.log('Sending reply message:', messageResponse);
        await client.replyMessage(replyToken, messageResponse);
        console.log('Reply message sent successfully.');
      })
      .catch((error) => {
        console.log('An error occurred:', error);
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