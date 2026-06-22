import hashlib

from app.hash_engine import build_merkle_tree, compute_sha256, verify_document_hash


def test_build_merkle_tree_empty_and_singleton():
    single_hash = compute_sha256(b"single")

    assert build_merkle_tree([]) == ""
    assert build_merkle_tree([single_hash]) == single_hash


def test_build_merkle_tree_with_known_pair():
    first_hash = "a" * 64
    second_hash = "b" * 64
    expected_root = hashlib.sha256((first_hash + second_hash).encode("utf-8")).hexdigest()

    assert build_merkle_tree([first_hash, second_hash]) == expected_root


def test_verify_document_hash_with_known_hash():
    file_bytes = b"hello pramanik"
    stored_hash = hashlib.sha256(file_bytes).hexdigest()

    assert verify_document_hash(file_bytes, stored_hash) == (True, "Hash verified")


def test_verify_document_hash_detects_mismatch():
    stored_hash = hashlib.sha256(b"original").hexdigest()
    is_valid, detail = verify_document_hash(b"modified", stored_hash)

    assert is_valid is False
    assert "Hash mismatch" in detail
