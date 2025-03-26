import { Capability, K8s, kind, Log } from "pepr";
import { Tenant } from "./generated/tenant-v2";
import { MinioManager } from "./generated/miniomanager-v1alpha1";

export const manager = new Capability({
  name: "minio-manager",
  description: "Manage the MinIO Operator based on Nodes",
});

const { When } = manager;

const minIOLabel = "minio";
let currentManager = "";

/*
 * Update the tenant to have the correct number of servers
 */
When(Tenant)
  .IsCreatedOrUpdated()
  .Mutate(async tenant => {
    // Get the list of nodes with the minio label
    const acceptableNodeList = await K8s(kind.Node)
      .WithLabel(minIOLabel, "true")
      .Get();

    // Set the annotation to the tenant
    tenant.SetAnnotation("pepr.dev/controller", "minio-manager");

    // Set the number of servers to the number of acceptable nodes
    tenant.Raw.spec.pools[0].servers = acceptableNodeList.items.length;
  })
  .Validate(async tenant => {
    // Get the list of nodes with the minio label
    const acceptableNodeList = await K8s(kind.Node)
      .WithLabel(minIOLabel, "true")
      .Get();

    // Check if the number of servers in the tenant matches the number of acceptable nodes
    if (tenant.Raw.spec.pools[0].servers !== acceptableNodeList.items.length) {
      return tenant.Deny(
        `The number of servers in the tenant ${tenant.Raw.metadata.name} in namespace ${tenant.Raw.metadata.namespace} does not match the number of acceptable nodes`,
      );
    }
    return tenant.Approve();
  });

When(MinioManager)
  .IsCreatedOrUpdated()
  .Mutate(async manager => {
    // copy secrets
    for (const secret of manager.Raw.spec.secrets) {
      const { fromNamespace, name, toNamespace } = secret;
      try {
        const secretObj = await K8s(kind.Secret)
          .InNamespace(fromNamespace)
          .Get(name);

        await K8s(kind.Secret).Apply(
          {
            metadata: {
              name,
              namespace: toNamespace,
            },
            data: secretObj.data,
          },
          { force: true },
        );
      } catch (e) {
        Log.error("Failed to copy secret", { e });
      }
    }
  })
  .Validate(manager => {
    if (manager.Raw.metadata.namespace !== "minio") {
      return manager.Deny("The MinioManager must be in the minio namespace");
    }

    if (currentManager !== "" && currentManager !== manager.Raw.metadata.name) {
      return manager.Deny("Only one MinioManager is allowed in the cluster");
    }

    currentManager = manager.Raw.metadata.name;

    return manager.Approve();
  });
