const line = require('@line/bot-sdk')

const handler = async (event) => {
  // 取得環境變數
  const clientConfig = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.CHANNEL_SECRET,
  };
  // 用 CHANNEL_ACCESS_TOKEN 和 CHANNEL_SECRET 初始化 Line Bot
  const client = new line.Client(clientConfig);

  // 為 Webhook 驗證做準備
  const signature = event.headers['x-line-signature'];
  const body = event.body;

  // Line Bot 運作邏輯
  const handleEvent = async (event) => {
    if (event.type !== 'message' || event.message.type !== 'text') {
      return Promise.resolve(null)
    }
    const { replyToken } = event;
    const { text } = event.message;

    // Create a new message.
    const response = {
      type: 'text',
      text: `而 Netlify 的回音盪漾著：${text}～`,
    };
    await client.replyMessage(replyToken, response)
  }

  try {
    // 用 CHANNEL_SECRET 來驗證 Line Bot 身分
    if (!line.validateSignature(body, clientConfig.channelSecret, signature)) {
      throw new line.exceptions.SignatureValidationFailed("signature validation failed", signature)
    }

    // 將 JSON 轉為 JavaScript 物件
    const objBody = JSON.parse(body);
    // 將觸發事件交給 Line Bot 做處理
    await Promise.all(objBody.events.map(handleEvent))

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Hello from Netlify" }),
    }
  } catch (error) {
    console.log(error)
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }