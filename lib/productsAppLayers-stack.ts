import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import Settings from "../helpers/settings";

export class ProductsAppLayersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const productsLayers = new lambda.LayerVersion(this, 'ProductsLayer', {
      code: lambda.Code.fromAsset('lambda/products/layers/productsLayer'),
      compatibleRuntimes: [Settings.defaultNodeRuntimeOptions.runtime],
      layerVersionName: 'ProductsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    new ssm.StringParameter(this, 'ProductsLayerVersionArn', {
      parameterName: 'ProductsLayerVersionArn',
      stringValue: productsLayers.layerVersionArn,
    })

    const productEventsLayers = new lambda.LayerVersion(this, 'ProductEventsLayer', {
      code: lambda.Code.fromAsset('lambda/products/layers/productEventsLayer'),
      compatibleRuntimes: [Settings.defaultNodeRuntimeOptions.runtime],
      layerVersionName: 'ProductEventsLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    new ssm.StringParameter(this, 'ProductEventsLayerVersionArn', {
      parameterName: 'ProductEventsLayerVersionArn',
      stringValue: productEventsLayers.layerVersionArn,
    })
  }
}
