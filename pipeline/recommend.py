import numpy as np
import torch
from scipy.sparse import load_npz
from multiprocessing import Pool
from fire.fire_dataloader import Dataset as FireDataset
from fire.fire_model import FIRE
from model.graph import make_adj_from_interaction, symmetric_normalize_coo
from model.model import LightGCN

fire_ds = FireDataset('ml-latest-small', num_his_month=6, num_cur_month=1)
init_adj, init_time = fire_ds.get_init_mats()
cur_adj, time_mat, cur_time, _, _ = fire_ds.get_train_test_data()
user_si, item_si = fire_ds.get_user_item_sim_mat(False, 0, False, 0)
_fire = FIRE(init_adj, init_time, decay_factor=1e-6, pri_factor=128,
             alpha_list=[0.2]*4, use_user_si=False, use_item_si=False)

train_coo = load_npz("pipeline/dataset/processed/train_matrix.npz").tocoo()
num_users, num_items = train_coo.shape
indices = torch.tensor([train_coo.row, train_coo.col], dtype=torch.int64)
values = torch.tensor(train_coo.data, dtype=torch.float32)
r_mat = torch.sparse_coo_tensor(indices, values, (num_users, num_items))
adj = symmetric_normalize_coo(make_adj_from_interaction(r_mat))
_model = LightGCN(num_users, hidden_dim=3, embedding_dim=64,
                   output_dim=num_items, adj=adj, r_mat=r_mat)
_model.load_state_dict(torch.load("pipeline/run/lightgcn_final.pth", map_location="cpu"))
_model.eval()

def get_recommendations(user_id: int, k: int = 10):
    _fire.train(cur_adj, time_mat, cur_time, user_si, item_si)
    scores = _fire.test()
    top_c = 100
    cands = np.argpartition(-scores, top_c, axis=1)[:, :top_c]
    row = cands[user_id]
    row = row[np.argsort(-scores[user_id, row])]
    with torch.no_grad():
        users, items = _model()
    emb_u = users[user_id].unsqueeze(1)
    emb_c = items[row]
    sc = (emb_c @ emb_u).squeeze()
    topk = torch.topk(sc, k=k).indices.cpu().numpy()
    return row[topk].tolist()