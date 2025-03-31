# MinIO Manager

**Disclaimer** _The minIO Manager is a Kubernetes Operator that needs to be installed _before_ minio is installed since the `Tenant` instance server field is immutable._

Manages MinIO instances in a Kubernetes cluster by mutating the MinIO Tenant CRD to have the correct number of servers based on available nodes and replicates secrets to namespaces where MinIO is consumed.



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

Create a secret for MinioManager to clone

```bash
kubectl create secret generic -n minio something --from-literal=hi=there
```

Create an instance of MinioManager

```yaml
kubectl apply -f -<<EOF
apiVersion: uds.dev/v1alpha1
kind: MinioManager
metadata:
  name: minio-manager
  namespace: minio
spec:
  secrets:
    - name: something
      fromNamespace: minio
      toNamespace: default
EOF
```

Check if the secret was copied

```bash
kubectl get secret something
```

Create a new secret to make sure it works

```bash
kubectl create secret generic -n minio something-else --from-literal=hi=there
```

Update the instance of MinioManager

```yaml
kubectl apply -f -<<EOF
apiVersion: uds.dev/v1alpha1
kind: MinioManager
metadata:
  name: minio-manager
  namespace: minio
spec:
  secrets:
    - name: something
      fromNamespace: minio
      toNamespace: default
    - name: something-else
      fromNamespace: minio
      toNamespace: default
EOF
```

Get the secrets in default namespace

```bash
kubectl get secret 
```

```output
NAME             TYPE     DATA   AGE
something        Opaque   1      31s
something-else   Opaque   1      8s
```

