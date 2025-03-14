import { beforeAll, afterAll, describe, it, expect } from "@jest/globals";
import { execSync, spawnSync } from 'node:child_process';
describe("minio-manager", () => {
  beforeAll(async () => {
    execSync("npm run k3d-setup", { stdio: "inherit" });
    execSync("npm run apply-crd", { stdio: "inherit" });
  });

  it("should be true", () => {
    expect(true).toBe(true);
  })

//   it("watches resource creates", async () => {
//     const file = `${trc.root()}/capabilities/scenario.create.yaml`;
//     const resources = await trc.load(file);
//     await fullCreate(resources, kind);

//     // no direct assertion -- test succeeds when message is logged
//     await untilLogged("Watched create-me: create");
//   }, secs(10));

//   it("watches resource create-or-updates", async () => {
//     const file = `${trc.root()}/capabilities/scenario.create-or-update.yaml`;
//     const resources = await trc.load(file);
//     await fullCreate(resources, kind);
//     await untilLogged("Watched create-or-update-me: ADDED");

//     const update = {...resources.at(-1), stringData: { k: "v" }};
//     await K8s(kind.Secret).Apply(update);

//     // no direct assertion -- test succeeds when message is logged
//     await untilLogged("Watched create-or-update-me: MODIFIED");
//   }, secs(10));

//   it("watches resource updates", async () => {
//     const file = `${trc.root()}/capabilities/scenario.update.yaml`;
//     const resources = await trc.load(file);
//     await fullCreate(resources, kind);

//     const update = {...resources.at(-1), stringData: { k: "v" }};
//     await K8s(kind.Secret).Apply(update);

//     // no direct assertion -- test succeeds when message is logged
//     await untilLogged("Watched update-me: update");
//   }, secs(10));

//   it("watches resource deletes", async () => {
//     const file = `${trc.root()}/capabilities/scenario.delete.yaml`;
//     const resources = await trc.load(file);
//     await fullCreate(resources, kind);

//     const { namespace, name } = resources.at(-1).metadata;
//     await K8s(kind.Secret).InNamespace(namespace).Delete(name);

//     // no direct assertion -- test succeeds when message is logged
//     await untilLogged("Watched delete-me: delete");
//   }, secs(10));
});
