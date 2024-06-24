import * as cdk from 'aws-cdk-lib'
import { Construct } from "constructs"
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import Settings from "../helpers/settings";

export class OrdersAppLayersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const ordersLayer = new lambda.LayerVersion(this, 'OrdersLayer', {
      code: lambda.Code.fromAsset('lambda/orders/layers/ordersLayer'),
      compatibleRuntimes: [Settings.defaultNodeRuntimeOptions.runtime],
      layerVersionName: 'OrdersLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    new ssm.StringParameter(this, 'OrdersLayerVersionArn', {
      parameterName: 'OrdersLayerVersionArn',
      stringValue: ordersLayer.layerVersionArn
    })

    const ordersApiLayer = new lambda.LayerVersion(this, 'OrdersApiLayer', {
      code: lambda.Code.fromAsset('lambda/orders/layers/ordersApiLayer'),
      compatibleRuntimes: [Settings.defaultNodeRuntimeOptions.runtime],
      layerVersionName: 'OrdersApiLayer',
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })

    new ssm.StringParameter(this, 'OrdersApiLayerVersionArn', {
      parameterName: 'OrdersApiLayerVersionArn',
      stringValue: ordersApiLayer.layerVersionArn
    })
  }
}
