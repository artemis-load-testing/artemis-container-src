const aws = require('aws-sdk');
const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

const s3 = new aws.S3();
const fileName = 'test_script.js';

const fetchObject = async (fileName) => {
  try {
    const response = await s3
      .getObject({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
      })
      .promise();

    const content = response.Body.toString('utf-8');

    fs.writeFile('script.js', content, 'utf8', function (err) {
      if (err) {
        return console.log(err);
      }
      console.log('The test script file has been saved!');
    });
  } catch (e) {
    console.log(e);
  }
};

const runTest = async () => {
  try {
    await exec(
      `k6 run --no-summary --no-thresholds --tag task_count=${process.env.TASK_COUNT} --tag test_id=${process.env.TEST_ID} --out influxdb=http://artemis-telegraf.artemis:8186 script.js`
    );
    console.log('Test finished running!');
  } catch (e) {
    console.log(e);
  }
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const fetchScriptAndRun = async () => {
  const originTimestamp = Number(process.env.ORIGIN_TIMESTAMP);
  const currentTime = Date.now();
  const waitTime =
    currentTime < originTimestamp ? originTimestamp - currentTime : 0;

  await fetchObject(fileName);
  async function delay() {
    console.log(
      'originTimestamp ',
      originTimestamp,
      'currentTime ',
      currentTime
    );
    await sleep(waitTime);
    await runTest();
  }
  delay();
};

fetchScriptAndRun();
