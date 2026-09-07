#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
CERT_DIR="${ROOT_DIR}/certs"

if [[ ! -f "${ENV_FILE}" ]]; then
    echo "Error: ${ENV_FILE} does not exist"
    exit 1
fi

HOST_IP="$(
    sed -n 's/^HOST_IP=//p' "${ENV_FILE}" \
        | tail -n 1 \
        | tr -d '\r"' \
        | xargs
)"

if [[ -z "${HOST_IP}" ]]; then
    echo "Error: HOST_IP is not configured in .env"
    exit 1
fi

mkdir -p "${CERT_DIR}"

CA_KEY="${CERT_DIR}/localCA.key"
CA_CERT="${CERT_DIR}/localCA.pem"
SERVER_KEY="${CERT_DIR}/privkey.pem"
SERVER_CERT="${CERT_DIR}/fullchain.pem"
SERVER_CSR="${CERT_DIR}/server.csr"
SERVER_EXT="${CERT_DIR}/server.ext"

if [[ ! -s "${CA_KEY}" || ! -s "${CA_CERT}" ]]; then
    echo "Generating local certificate authority..."

    rm -f "${CA_KEY}" "${CA_CERT}" "${CERT_DIR}/localCA.srl"

    openssl genrsa \
        -out "${CA_KEY}" \
        4096

    openssl req \
        -x509 \
        -new \
        -sha256 \
        -days 3650 \
        -key "${CA_KEY}" \
        -out "${CA_CERT}" \
        -subj "/CN=Chess42 Local CA" \
        -addext "basicConstraints=critical,CA:TRUE" \
        -addext "keyUsage=critical,keyCertSign,cRLSign" \
        -addext "subjectKeyIdentifier=hash"
fi

SAN="DNS:localhost,IP:127.0.0.1"

if [[ "${HOST_IP}" != "127.0.0.1" ]]; then
    SAN="${SAN},IP:${HOST_IP}"
fi

echo "Generating HTTPS certificate for ${HOST_IP}..."

openssl genrsa \
    -out "${SERVER_KEY}" \
    2048

openssl req \
    -new \
    -key "${SERVER_KEY}" \
    -out "${SERVER_CSR}" \
    -subj "/CN=${HOST_IP}"

cat > "${SERVER_EXT}" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=${SAN}
EOF

openssl x509 \
    -req \
    -in "${SERVER_CSR}" \
    -CA "${CA_CERT}" \
    -CAkey "${CA_KEY}" \
    -CAcreateserial \
    -out "${SERVER_CERT}" \
    -days 365 \
    -sha256 \
    -extfile "${SERVER_EXT}"

rm -f "${SERVER_CSR}" "${SERVER_EXT}"

chmod 600 "${CA_KEY}" "${SERVER_KEY}"

openssl verify \
    -CAfile "${CA_CERT}" \
    "${SERVER_CERT}"

echo "HTTPS certificates are ready"
echo "Trusted CA certificate: ${CA_CERT}"