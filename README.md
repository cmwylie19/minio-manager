# MinIO Manager

Some background on the capability: Minio Operator creates a statefulset per minio pool whose size is set according to the number of servers.  The operator can also set anti-affinity and nodeSelector attributes for the STS.  It's desirable to only have one STS pod per node, and only certain nodes should be schedulable, so that's covered. However, there may be nodes dropping and joining the cluster with the desired nodSelector labels, but without manually modifying the Tenant CR, you wont get new pods automatically being provisioned on new nodes.


One caveat might be that idk if Pepr would be able to set the Tenant servers  without prior knowledge of the Tenant CRD.



## Other

```bash
npm run k3d-setup   
npm run apply-crd    
kubectl create ns minio
k label no/k3d-minio-manager-agent-0  minio=true
k label no/k3d-minio-manager-agent-1  minio=true
k label no/k3d-minio-manager-agent-2  minio=true
```

```yaml
kubectl apply -f -<<EOF
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: project-statefulset
spec:
  replicas: 3
  selector:
    matchLabels:
      app: project
  serviceName: project-service
  template:
    metadata:
      labels:
        app: project
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: app
                    operator: In
                    values:
                      - project
              topologyKey: kubernetes.io/hostname
      containers:
        - name: project-container
          image: nginx
EOF
```

```yaml
kubectl apply -f -<<EOF
apiVersion: minio.min.io/v2
kind: Tenant
metadata:
  name: minio
  namespace: minio
spec:
  pools:
    - servers: 2
      name: default
      volumesPerServer: 1
      volumeClaimTemplate:
        metadata:
          name: data
        spec:
          accessModes: ["ReadWriteOnce"]
          resources:
            requests:
              storage: 10Gi
  mountPath: /export
  requestAutoCert: true
EOF
```

```bash
> kubectl patch tenant minio -n minio --type='json' -p='[{"op": "replace", "path": "/spec/pools/0/servers", "value": 3}]'
The Tenant "minio" is invalid: spec.pools[0].servers: Invalid value: "integer": servers is immutable
```


## Questions

1. Will the tenant instance start with correct number of servers or do we need to ensure that it is correct?
