import * as cdk from 'aws-cdk-lib/core';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';

import { Construct } from 'constructs';
import DefaultSettings from '../helpers/settings';

export class ProductsAppStack extends cdk.Stack {
  readonly ProdictsFetchHandler: lambdaNodeJS.NodejsFunction;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.ProdictsFetchHandler = new lambdaNodeJS.NodejsFunction(this, 'ProductsFetchFunction', {
      ...DefaultSettings.defaultNodeRuntimeOptions,
      functionName: 'ProductsFetchFunction',
      entry: 'lambda/products/productsFetchFunction.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        sourceMap: false,
      }
    })
  }
}