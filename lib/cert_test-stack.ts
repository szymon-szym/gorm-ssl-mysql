import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export class CertTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  
    const vpc = new ec2.Vpc(this, 'VPC rds', {
      maxAzs: 2
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'rds-sg', {
      vpc,
      allowAllOutbound: true,
      description: 'RDS Security Group',
    });

    rdsSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3306), 'Allow inbound to rds');

    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_8_0}),
      description: 'RDS Parameter Group',
      parameters: {
        'require_secure_transport': 'ON'
      }
    });
    const dbInstance = new rds.DatabaseInstance(this, 'RDS Instance', {
      engine: rds.DatabaseInstanceEngine.mysql({version: rds.MysqlEngineVersion.VER_8_0}),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.SMALL),
      vpc,
      securityGroups: [rdsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      databaseName: 'dummy_DB',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      caCertificate: rds.CaCertificate.RDS_CA_2019,
      parameterGroup
    });
  }
}
