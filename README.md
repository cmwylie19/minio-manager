# MinIO Manager

**Disclaimer** _The minIO Manager is a Kubernetes Operator that needs to be installed _before_ minio is installed since the `Tenant` instance server field is immutable._

Manages MinIO instances in a Kubernetes cluster by mutating the MinIO Tenant CRD to have the correct number of servers based on available nodes and replicates secrets to namespaces where MinIO is consumed.

## Building

```bash
npx pepr build -z chart --rbac-mode=scoped --custom-name "generic-minio"
```

## e2e

```bash
npm run e2e
```



## Other

```bash
npm run k3d-setup   
npm run apply-crd   
npm run generate-crd
kubectl create ns minio
k label no/k3d-minio-manager-agent-0  minio=true
k label no/k3d-minio-manager-agent-1  minio=true
k label no/k3d-minio-manager-agent-2  minio=true
```

Start Pepr dev mode in a (side) terminal or background
```bash
npx pepr dev --confirm
```

Create a `Tenant` instance
```yaml
kubectl apply -f -<<EOF
apiVersion: minio.min.io/v2
kind: Tenant
metadata:
  name: minio
  namespace: minio
spec:
  pools:
    - servers: 2 # should get mutated
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

Get the servers (should be three)

```bash
kubectl get tenant -n minio minio -ojsonpath="{.spec.pools[0].servers}"
```

