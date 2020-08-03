#!/usr/bin/env sh

set -e

kubectl apply -f ../deploy-gcp/namespace.yaml
helm repo add stable https://kubernetes-charts.storage.googleapis.com/
helm repo add traefik https://containous.github.io/traefik-helm-chart
helm repo update

helm install traefik traefik/traefik \
    --namespace qca-ingress \
    --values values.traefik.yaml

kubectl ns qca
kubectl apply -f ../deploy-gcp/

# kubectl create secret generic dnschallenge-aws-access-key-id --from-literal=AWS_ACCESS_KEY_ID='stuff' -n qca-ingress
# kubectl create secret generic dnschallenge-aws-secret-access-key --from-literal=AWS_SECRET_ACCESS_KEY='stuff' -n qca-ingress

# helm upgrade traefik traefik/traefik --namespace qca-ingress -f values.traefik.yaml
# kubectl port-forward $(kubectl get pods --selector "app.kubernetes.io/name=traefik" --namespace qca-ingress --output=name) 9000:9000 --namespace qca-ingress
# kubectl logs -f  $(kubectl get pods --selector "app.kubernetes.io/name=traefik" --namespace qca-ingress --output=name) --namespace qca-ingress
