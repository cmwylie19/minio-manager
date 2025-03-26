import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { execSync } from "node:child_process";
describe("minio-manager", () => {
  beforeAll(() => {
    execSync("npm run k3d-setup", { stdio: "inherit" });
    execSync("npm run apply-crd", { stdio: "inherit" });
    execSync("npx pepr@latest build", { stdio: "inherit" });
    execSync("kubectl apply -f ./dist/pepr-module-minio-manager.yaml", { stdio: "inherit" });
    execSync("kubectl label no/k3d-minio-manager-agent-0  minio=true", { stdio: "inherit" });
    execSync("kubectl label no/k3d-minio-manager-agent-1  minio=true", { stdio: "inherit" });
    execSync("kubectl label no/k3d-minio-manager-agent-2  minio=true", { stdio: "inherit" });
    execSync("kubectl create ns minio", { stdio: "inherit" });
    execSync("kubectl create secret generic something --from-literal=hi=there -n minio", { stdio: "inherit" });
    execSync("kubectl create secret generic something-else --from-literal=hi=there -n minio", { stdio: "inherit" });
    execSync("kubectl wait --for=condition=ready -n pepr-system po -l app --timeout=180s", { stdio: "inherit" });
    execSync("kubectl apply -f ./e2e/miniomanager.instance.yaml", { stdio: "inherit" });
    execSync("kubectl apply -f ./e2e/minio.instance.yaml", { stdio: "inherit" });
  });

  afterAll(async () => {
    execSync("k3d cluster delete minio-manager", { stdio: "inherit" });
  });

  it("should be true", () => {
    expect(true).toBe(true);
  });

  it("should mutate the minio instance to have a server pool of 3 based on available nodes", async () => {
    const servers = execSync("kubectl get tenant -n minio minio -ojsonpath=\"{.spec.pools[0].servers}\"").toString();
    expect(servers).toBe("3");
  });

  it("should copy the secrets based on minio instance to the default namespace", async () => {
    const expected = "there";
    const something = execSync("kubectl get secret something -n default -o jsonpath='{.data.hi}' | base64 -d").toString();
    const somethingElse = execSync("kubectl get secret something-else -n default -o jsonpath='{.data.hi}' | base64 -d").toString();
    expect(something).toBe(expected);
    expect(somethingElse).toBe(expected);
  });
 
});
