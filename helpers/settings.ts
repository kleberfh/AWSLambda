import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

const defaultNodeRuntimeOptions = {
  memorySize: 128,
  timeout: Duration.seconds(5),
  runtime: Runtime.NODEJS_18_X,
}

const DefaultSettings = {
  defaultNodeRuntimeOptions,
}

export default DefaultSettings
