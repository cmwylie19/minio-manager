import { Capability, K8s, a, Log } from "pepr";
import { Tenant } from "./generated/tenant-v2";

export const MinIOManager = new Capability({
  name: "minio-manager",
  description: "Manage the MinIO Operator based on Nodes",
});

const { When } = MinIOManager;

const minIOLabel = "minio";
const acceptableNodes: Record<string, string> = {};
const tenantInstances: Record<string, Tenant> = {};

// When(a.PersistentVolume)
// .IsCreated()
// .WithLabel("tbd")
// .Mutate(pv => {
//   // Set volumeClaimPolicy to return
//   pv.Raw.spec.persistentVolumeReclaimPolicy = "Retain";
// });

When(a.PersistentVolume);

/*
 * Keep an updated list of tenant instances
 */

When(Tenant)
  .IsCreatedOrUpdated()
  // .Mutate(tenant => {
  //   tenant.SetAnnotation("pepr.dev/controller", "minio-manager");
  //   tenant.Raw.spec.pools[0].servers = Object.keys(acceptableNodes).length;
  // })
  .Watch(async tenant => {
    if (tenant.spec.pools[0].servers !== Object.keys(acceptableNodes).length) {
      try {
        delete tenant.metadata.managedFields;
        delete tenant.metadata.resourceVersion;
        delete tenant.metadata.uid;
        delete tenant.metadata.generation;
        delete tenant.metadata.creationTimestamp;
        const aN = Object.keys(acceptableNodes).length;
        console.log(aN)
        tenant.spec.pools[0].servers = Object.keys(acceptableNodes).length;
        tenantInstances[
          `${tenant.metadata.name}/${tenant.metadata.namespace}`
        ] = tenant;
        Log.debug(
          `tenantInstance: ${JSON.stringify(tenantInstances[`${tenant.metadata.name}/${tenant.metadata.namespace}`], undefined, 2)}`,
        );

        await K8s(Tenant).Delete(tenant);
        await K8s(Tenant).Apply(tenant);
      } catch (error) {
        Log.error(
          `could not update servers in tenant ${tenant.metadata.name} in namespace ${tenant.metadata.namespace}`,
          {
            error,
          },
        );
      }
    }
  });

/*
 * Remove tenant from tenant list
 */

When(Tenant)
  .IsDeleted()
  .Mutate(tenant => {
    const { name, namespace } = tenant.Raw.metadata;
    delete tenantInstances[name];
    Log.debug(
      `Tenant ${name}in ${namespace} was deleted. Current tenantInstaces: ${JSON.stringify(tenantInstances)}`,
    );
  });

/*
 * Determine if node is acceptable to schedule minIO pods
 */

When(a.Node)
  .IsCreatedOrUpdated()
  .Watch(async no => {
    const timeStamp = new Date().toISOString();
    if (no.metadata?.labels[minIOLabel] === "true") {
      acceptableNodes[no.metadata?.name] = timeStamp;

      // Update the servers in minIO instances
      for (const [name, obj] of Object.entries(tenantInstances)) {
        const { namespace } = obj.metadata;
        await K8s(Tenant).Delete(obj);
        try {
          obj.spec.pools[0].servers = Object.keys(acceptableNodes).length;
          delete obj.metadata.managedFields;
          delete obj.metadata.resourceVersion;
          delete obj.metadata.uid;
          delete obj.metadata.generation;
          delete obj.metadata.creationTimestamp;
          await K8s(Tenant).Apply(obj);
        } catch (error) {
          Log.error(
            `could not update servers in tenant ${name} in namespace ${namespace}`,
            {
              error,
            },
          );
        }
      }
    }
  });

/*
 * Remove node from acceptable list
 */

When(a.Node)
  .IsDeleted()

  .Watch(async no => {
    if (no.metadata?.labels[minIOLabel] === "true") {
      delete acceptableNodes[no.metadata?.name];
    }

    // Update the servers in minIO instances
    for (const [name, obj] of Object.entries(tenantInstances)) {
      const { namespace } = obj.metadata;
      await K8s(Tenant).Delete(obj);
      try {
        obj.spec.pools[0].servers = Object.keys(acceptableNodes).length;
        delete obj.metadata.managedFields;
        delete obj.metadata.resourceVersion;
        delete obj.metadata.uid;
        delete obj.metadata.generation;
        delete obj.metadata.creationTimestamp;
        await K8s(Tenant).Apply(obj);
      } catch (error) {
        Log.error(
          `could not update servers in tenant ${name} in namespace ${namespace}`,
          {
            error,
          },
        );
      }
    }
  });
