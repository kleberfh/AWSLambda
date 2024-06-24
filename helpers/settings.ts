import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

const defaultNodeRuntimeOptions = {
  memorySize: 512,
  timeout: Duration.seconds(5),
  runtime: Runtime.NODEJS_20_X,
}

const DefaultSettings = {
  defaultNodeRuntimeOptions,
}

export default DefaultSettings
