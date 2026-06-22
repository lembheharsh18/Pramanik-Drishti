import hashlib
import json


def compute_sha256(file_bytes: bytes) -> str:
    return hashlib.sha256(file_bytes).hexdigest()


def compute_result_hash(data: dict) -> str:
    json_string = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_string.encode("utf-8")).hexdigest()


def build_merkle_tree(hashes: list[str]) -> str:
    if not hashes:
        return ""

    current_level = hashes[:]

    while len(current_level) > 1:
        if len(current_level) % 2 != 0:
            current_level.append(current_level[-1])

        next_level = []
        for index in range(0, len(current_level), 2):
            combined_hash = current_level[index] + current_level[index + 1]
            next_level.append(compute_sha256(combined_hash.encode("utf-8")))

        current_level = next_level

    return current_level[0]


def verify_document_hash(uploaded_bytes: bytes, stored_hash: str) -> tuple[bool, str]:
    computed = compute_sha256(uploaded_bytes)

    if computed == stored_hash:
        return True, "Hash verified"

    return (
        False,
        f"Hash mismatch. Expected {stored_hash[:16]}... Got {computed[:16]}...",
    )


def verify_bundle_seal(
    submitted_hashes: list[str], stored_merkle_root: str
) -> tuple[bool, str]:
    computed_merkle_root = build_merkle_tree(submitted_hashes)

    if computed_merkle_root == stored_merkle_root:
        return True, "Bundle seal intact"

    return (
        False,
        "Bundle seal broken - one or more documents have been swapped or replaced",
    )


if __name__ == "__main__":
    fake_documents = [
        b"land record document",
        b"salary slip document",
        b"itr document",
        b"valuation report document",
        b"sale deed document",
    ]

    document_hashes = [compute_sha256(document) for document in fake_documents]
    merkle_root = build_merkle_tree(document_hashes)
    intact_status, intact_detail = verify_bundle_seal(document_hashes, merkle_root)

    tampered_hashes = document_hashes[:]
    tampered_hashes[2] = compute_sha256(b"modified itr document")
    broken_status, broken_detail = verify_bundle_seal(tampered_hashes, merkle_root)

    print("PRAMANIK-A/C hash engine smoke test")
    print("-----------------------------------")
    print(f"Document count: {len(fake_documents)}")
    print(f"Merkle root: {merkle_root}")
    print(f"Intact bundle: {intact_status} - {intact_detail}")
    print(f"Tampered bundle: {broken_status} - {broken_detail}")
