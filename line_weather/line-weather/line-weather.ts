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
    fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${text}&limit=5&appid=${WEAKey}`)
    .then((response) => response.json())
    .then((data) => {
      // 在这里处理获取到的数据
      console.log(data);
      const lat = data[0].lat;
      const lon = data[0].lon;
      return fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEAKey}&units=Metric`);
      // 在这里进行后续的处理
      // ...
    })
    .then((response) => response.json())
    .then((data) => {
    // 处理第二个fetch请求返回的数据
      console.log(data);

      const city= data.name;
      const speed=data.wind.speed;
      const gust=data.wind.gust;
      const humidity=data.main.humidity;
      const temp_max=data.main.temp_max;
      const temp_min=data.main.temp_min;
      const feels_like=data.main.feels_like;
      const temp=data.main.temp;
      // Create a new message
      const messageResponse  = {
        type: 'text',
        text: `城市名稱:${city}\n
               溫度:${temp}\n
               體感溫度:${feels_like}\n
               最低溫:${temp_min}\n
               最高溫:${temp_max}\n
               濕度:${humidity}\n
               風速:${speed}\n
               陣風:${gust}\n`,
      };
      await client.replyMessage(replyToken, messageResponse );
    })
    .catch((error) => {
      // 处理请求过程中的错误
      console.log(error);
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