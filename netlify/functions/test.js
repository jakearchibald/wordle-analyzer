exports.handler = async function (event, context) {
  console.log('headers', event.headers);
  console.log('queryStringParameters', event.queryStringParameters);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello World' }),
  };
};
