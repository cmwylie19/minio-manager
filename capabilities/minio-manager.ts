import { Capability, K8s, kind } from "pepr";
import { Tenant } from "./generated/tenant-v2";

export const MinIOManager = new Capability({
  name: "minio-manager",
  description: "Manage the MinIO Operator based on Nodes",
});

const { When } = MinIOManager;

const minIOLabel = "minio";

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
    if (
      tenant.Raw.spec.pools[0].servers !== acceptableNodeList.items.length
    ) {
      return tenant.Deny(
        `The number of servers in the tenant ${tenant.Raw.metadata.name} in namespace ${tenant.Raw.metadata.namespace} does not match the number of acceptable nodes`,
      );
    }
    return tenant.Approve();
  });
