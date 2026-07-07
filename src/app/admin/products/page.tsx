"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function ProductManagement() {
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    price: 0,
    ref: "",
    identifier: "",
    imgNumber: 1,
  });
  const [images, setImages] = useState<FileList | null>(null);

  const { data: products, refetch } = api.admin.getAllProducts.useQuery();

  const createProductMutation = api.admin.createProduct.useMutation({
    onSuccess: () => {
      void refetch();
      setIsCreating(false);
      setEditingProduct(null);
      setImages(null);
    },
  });

  const updateProductMutation = api.admin.updateProduct.useMutation({
    onSuccess: () => {
      void refetch();
      setIsCreating(false);
      setEditingProduct(null);
      setImages(null);
    },
  });

  const deleteProductMutation = api.admin.deleteProduct.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  const _resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      price: 0,
      ref: "",
      identifier: "",
      imgNumber: 1,
    });
    setEditingProduct(null);
    setIsCreating(false);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      price: product.price,
      ref: product.ref,
      identifier: product.identifier,
      imgNumber: product.imgNumber,
    });
    setImages(null);
    setIsCreating(false);
  };

  const handleCreateProduct = () => {
    setIsCreating(true);
    setEditingProduct(null);
    setFormData({
      title: "",
      subtitle: "",
      description: "",
      price: 0,
      ref: "",
      identifier: "",
      imgNumber: 1,
    });
    setImages(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images && images.length > 0) {
      const fd = new FormData();
      fd.set("identifier", formData.identifier);
      if (editingProduct) {
        fd.set("replace", "true");
        fd.set("previousImgNumber", String(editingProduct.imgNumber ?? 0));
      }
      Array.from(images).forEach((file) => fd.append("files", file));
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Upload échoué: ${err.error ?? res.statusText}`);
        return;
      }
    }

    const imgNumber = images ? images.length : formData.imgNumber;
    const productData = {
      ...formData,
      imgNumber,
    };

    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        ...productData,
      });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) {
      deleteProductMutation.mutate({ id });
    }
  };

  return (
    <div>
      <h1>Gestion des produits</h1>

      <div>
        <button onClick={handleCreateProduct}>Créer un nouveau produit</button>
      </div>

      {(isCreating ?? editingProduct) && (
        <div>
          <h2>{editingProduct ? "Modifier le produit" : "Créer un produit"}</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Titre:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Sous-titre:</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Description:</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Prix (en centimes):</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                required
                min="1"
              />
            </div>

            <div>
              <label>Référence:</label>
              <input
                type="text"
                value={formData.ref}
                onChange={(e) =>
                  setFormData({ ...formData, ref: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Identifiant:</label>
              <input
                type="text"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Images du produit:</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImages(e.target.files)}
              />
              {images && images.length > 0 && (
                <p>
                  {images.length} image{images.length > 1 ? "s" : ""}{" "}
                  sélectionnée{images.length > 1 ? "s" : ""}
                </p>
              )}
              {editingProduct && !images && (
                <p>
                  Images actuelles: {formData.imgNumber} image
                  {formData.imgNumber > 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={
                  createProductMutation.isPending ||
                  updateProductMutation.isPending
                }
              >
                {editingProduct ? "Mettre à jour" : "Créer"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProduct(null);
                  setImages(null);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h2>Liste des produits</h2>
        {products && products.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Sous-titre</th>
                <th>Prix</th>
                <th>Référence</th>
                <th>Identifiant</th>
                <th>Images</th>
                <th>Date de création</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.subtitle}</td>
                  <td>{product.price / 100}€</td>
                  <td>{product.ref}</td>
                  <td>{product.identifier}</td>
                  <td>{product.imgNumber}</td>
                  <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleEditProduct(product)}>
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteProductMutation.isPending}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Aucun produit trouvé</p>
        )}
      </div>

      <div>
        <a href="/admin">← Retour au tableau de bord</a>
      </div>
    </div>
  );
}
