# MinIO Manager

**Disclaimer** _The minIO Manager is a Kubernetes Operator that needs to be installed _before_ minio is installed since the `Tenant` instance server field is immutable._

Manages MinIO instances in a Kubernetes cluster by mutating the MinIO Tenant CRD to have the correct number of servers based on available nodes.

## Deploying to Prod

1. Build your module in the pipeline with the helm chart. The `package.json` is already configured to build with `--rbac-mode=scoped` with enough permissions to `get` and `list` the nodes in the cluster. We are using `--custon-name` so that we can deploy multiple modules in the same cluster with `Zarf`. This prepares the Zarf file and helm chart.

```bash
npx pepr@latest build --custom-name minio-manager -z chart
```

2. Now, assuming we are running across multiple nodes, we want to set the helm `values.yaml` to have `antiAffinity` rules so that the pods are distributed across the nodes. Make them more resistent to node failures.

```yaml
admission:
  antiAffinity: true
```

3. Build the module with Zarf

```bash
zarf package create 
```

4. Deploy the module with Zarf 

```bash
zarf package deploy 
```



## e2e

```bash
npm run e2e
```



## Demo

Setup the multi-node cluster with k3d and generate the CRDs.

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

